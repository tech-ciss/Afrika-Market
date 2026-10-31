import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { decrementStock, restoreStock, StockError } from "@/lib/services/stock.service";

type Tx = Prisma.TransactionClient;

function fakeTx(updateManyResult: { count: number }) {
  return {
    product: {
      updateMany: vi.fn().mockResolvedValue(updateManyResult),
      update: vi.fn().mockResolvedValue({}),
    },
    productVariant: {
      updateMany: vi.fn().mockResolvedValue(updateManyResult),
      update: vi.fn().mockResolvedValue({}),
    },
  };
}

describe("stock — décrément transactionnel (§31)", () => {
  it("décrémente le stock quand la quantité est disponible", async () => {
    const tx = fakeTx({ count: 1 });
    await expect(
      decrementStock(tx as unknown as Tx, [{ productId: "p1", variantId: null, quantity: 2 }]),
    ).resolves.toBeUndefined();
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: "p1", stock: { gte: 2 } },
      data: { stock: { decrement: 2 }, salesCount: { increment: 2 } },
    });
  });

  it("échoue quand le stock est insuffisant (aucune ligne mise à jour)", async () => {
    const tx = fakeTx({ count: 0 });
    await expect(
      decrementStock(tx as unknown as Tx, [{ productId: "p1", variantId: null, quantity: 5 }]),
    ).rejects.toBeInstanceOf(StockError);
  });

  it("décrémente une variante via sa propre table", async () => {
    const tx = fakeTx({ count: 1 });
    await decrementStock(tx as unknown as Tx, [{ productId: "p1", variantId: "v1", quantity: 1 }]);
    expect(tx.productVariant.updateMany).toHaveBeenCalledWith({
      where: { id: "v1", stock: { gte: 1 } },
      data: { stock: { decrement: 1 } },
    });
  });

  it("échoue sur une variante épuisée", async () => {
    const tx = fakeTx({ count: 0 });
    await expect(
      decrementStock(tx as unknown as Tx, [{ productId: "p1", variantId: "v1", quantity: 1 }]),
    ).rejects.toMatchObject({ code: "STOCK_INSUFFISANT" });
  });

  it("refuse une commande mixante dès qu'une ligne est en défaut", async () => {
    const tx = {
      product: {
        updateMany: vi
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 0 }),
        update: vi.fn(),
      },
      productVariant: { updateMany: vi.fn(), update: vi.fn() },
    };
    await expect(
      decrementStock(tx as unknown as Tx, [
        { productId: "p1", variantId: null, quantity: 1 },
        { productId: "p2", variantId: null, quantity: 10 },
      ]),
    ).rejects.toBeInstanceOf(StockError);
  });
});

describe("stock — restitution", () => {
  it("restitue le stock lors d'une annulation", async () => {
    const tx = fakeTx({ count: 1 });
    await restoreStock(tx as unknown as Tx, [{ productId: "p1", variantId: null, quantity: 3 }]);
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { stock: { increment: 3 }, salesCount: { decrement: 3 } },
    });
  });

  it("restitue le stock d'une variante", async () => {
    const tx = fakeTx({ count: 1 });
    await restoreStock(tx as unknown as Tx, [{ productId: "p1", variantId: "v1", quantity: 2 }]);
    expect(tx.productVariant.update).toHaveBeenCalledWith({
      where: { id: "v1" },
      data: { stock: { increment: 2 } },
    });
  });
});
