import { describe, expect, it } from "vitest";
import type { Prisma } from "@prisma/client";
import { decrementStock, StockError } from "@/lib/services/stock.service";

type Tx = Prisma.TransactionClient;

/**
 * Faux client Prisma qui reproduit la garantie d'une base SQL :
 * un `UPDATE … WHERE id = ? AND stock >= ?` est atomique (verrou de ligne).
 * Le `await` initial simule la latence réseau : les « acheteurs » s'entrelacent,
 * mais la vérification + le décrément restent indivisibles, comme dans PostgreSQL.
 */
function createFakeDb(initialStock: number) {
  const db = { stock: initialStock, salesCount: 0 };

  const tx = {
    product: {
      updateMany: async (args: {
        where: { id: string; stock: { gte: number } };
        data: { stock: { decrement: number }; salesCount: { increment: number } };
      }) => {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 5));
        if (db.stock >= args.where.stock.gte) {
          db.stock -= args.data.stock.decrement;
          db.salesCount += args.data.salesCount.increment;
          return { count: 1 };
        }
        return { count: 0 };
      },
    },
    productVariant: {
      updateMany: async () => ({ count: 0 }),
    },
  };

  return { db, tx: tx as unknown as Tx };
}

const buy = (tx: Tx, quantity = 1) =>
  decrementStock(tx, [{ productId: "p1", variantId: null, quantity }]);

describe("stock — achats simultanés (§31, §33)", () => {
  it("une seule unité restante : 10 acheteurs en parallèle, un seul réussit", async () => {
    const { db, tx } = createFakeDb(1);

    const results = await Promise.allSettled(Array.from({ length: 10 }, () => buy(tx)));

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(9);
    for (const r of rejected) {
      expect((r as PromiseRejectedResult).reason).toBeInstanceOf(StockError);
    }
    expect(db.stock).toBe(0);
    expect(db.salesCount).toBe(1);
  });

  it("stock de 5 et 8 acheteurs d'une unité : exactement 5 ventes, jamais de stock négatif", async () => {
    const { db, tx } = createFakeDb(5);

    const results = await Promise.allSettled(Array.from({ length: 8 }, () => buy(tx)));

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(5);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(3);
    expect(db.stock).toBe(0);
    expect(db.stock).toBeGreaterThanOrEqual(0);
  });

  it("deux commandes de 3 unités sur un stock de 5 : une seule passe, le stock reste à 2", async () => {
    const { db, tx } = createFakeDb(5);

    const results = await Promise.allSettled([buy(tx, 3), buy(tx, 3)]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    expect(db.stock).toBe(2);
  });
});
