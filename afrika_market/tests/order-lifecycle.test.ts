import { beforeEach, describe, expect, it, vi } from "vitest";

// Prisma est entièrement simulé : on vérifie les règles métier (stock, paiement, statuts),
// pas le SQL. `$transaction` exécute simplement le callback avec le même faux client.
const db = vi.hoisted(() => {
  const client = {
    order: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), updateMany: vi.fn(), count: vi.fn() },
    payment: { updateMany: vi.fn(), update: vi.fn() },
    delivery: { updateMany: vi.fn() },
    orderEvent: { create: vi.fn() },
    product: { update: vi.fn() },
    productVariant: { update: vi.fn() },
    $transaction: vi.fn(),
  };
  client.$transaction.mockImplementation(async (fn: (tx: typeof client) => unknown) => fn(client));
  return client;
});
vi.mock("@/lib/db/prisma", () => ({ prisma: db }));

import {
  cancelOrder,
  expireUnpaidOrders,
  generateOrderNumber,
  handlePaymentEvent,
  markOrderPaid,
  markPaymentFailed,
  refundOrder,
  transitionOrder,
} from "@/lib/services/order.service";

function makeOrder(over: Record<string, unknown> = {}) {
  return {
    id: "o1",
    number: "AM-20261027-00001",
    status: "PENDING_PAYMENT",
    isPaid: false,
    total: 12500,
    paymentMethod: "wave",
    items: [
      { productId: "p1", variantId: null, quantity: 2 },
      { productId: "p2", variantId: "v2", quantity: 1 },
    ],
    payment: { id: "pay1", provider: "wave", providerRef: "SBX-REF", status: "PENDING" },
    delivery: { id: "d1", status: "PENDING" },
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  db.$transaction.mockImplementation(async (fn: (tx: typeof db) => unknown) => fn(db));
  db.order.updateMany.mockResolvedValue({ count: 1 });
  db.payment.updateMany.mockResolvedValue({ count: 1 });
  db.delivery.updateMany.mockResolvedValue({ count: 1 });
});

describe("annulation — restitution du stock", () => {
  it("restitue le stock produit ET variante, clôture paiement et livraison", async () => {
    db.order.findUnique.mockResolvedValue(makeOrder());
    const result = await cancelOrder("AM-20261027-00001", "Test");

    expect(result).toEqual({ changed: true, status: "CANCELLED" });
    expect(db.product.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { stock: { increment: 2 }, salesCount: { decrement: 2 } },
    });
    expect(db.productVariant.update).toHaveBeenCalledWith({
      where: { id: "v2" },
      data: { stock: { increment: 1 } },
    });
    expect(db.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "CANCELLED" }) }),
    );
  });

  it("est idempotent : une commande déjà annulée ne rend pas le stock deux fois", async () => {
    db.order.findUnique.mockResolvedValue(makeOrder({ status: "CANCELLED" }));
    const result = await cancelOrder("AM-20261027-00001");
    expect(result.changed).toBe(false);
    expect(db.product.update).not.toHaveBeenCalled();
  });

  it("n'applique rien si une autre requête a modifié la commande entre-temps", async () => {
    db.order.findUnique.mockResolvedValue(makeOrder());
    db.order.updateMany.mockResolvedValue({ count: 0 });
    await expect(cancelOrder("AM-20261027-00001")).rejects.toThrow(/modifiée entre-temps/);
    expect(db.product.update).not.toHaveBeenCalled();
  });

  it("refuse d'annuler une commande livrée", async () => {
    db.order.findUnique.mockResolvedValue(makeOrder({ status: "DELIVERED", isPaid: true }));
    await expect(cancelOrder("AM-20261027-00001")).rejects.toThrow(/livrée/);
  });

  it("rembourse en même temps une commande déjà payée", async () => {
    db.order.findUnique.mockResolvedValue(
      makeOrder({ status: "PAID", isPaid: true, payment: { id: "pay1", provider: "sandbox", providerRef: "SBX-REF" } }),
    );
    await cancelOrder("AM-20261027-00001");
    expect(db.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "REFUNDED" }) }),
    );
    expect(db.product.update).toHaveBeenCalled();
  });

  it("transitionOrder(CANCELLED) passe par l'annulation (le stock est bien restitué)", async () => {
    db.order.findUnique.mockResolvedValue(makeOrder());
    await transitionOrder("o1", "CANCELLED", "Admin");
    expect(db.product.update).toHaveBeenCalledTimes(1);
  });
});

describe("remboursement", () => {
  it("refuse de rembourser une commande non payée", async () => {
    db.order.findUnique.mockResolvedValue(makeOrder());
    await expect(refundOrder("AM-20261027-00001")).rejects.toThrow(/pas été payée/);
  });

  it("restitue le stock d'une commande payée non livrée", async () => {
    db.order.findUnique.mockResolvedValue(
      makeOrder({ status: "PAID", isPaid: true, payment: { id: "pay1", provider: "sandbox", providerRef: "SBX-REF" } }),
    );
    const result = await refundOrder("AM-20261027-00001");
    expect(result.status).toBe("REFUNDED");
    expect(db.product.update).toHaveBeenCalled();
  });

  it("ne remet pas en stock un colis déjà livré", async () => {
    db.order.findUnique.mockResolvedValue(
      makeOrder({ status: "DELIVERED", isPaid: true, payment: { id: "pay1", provider: "sandbox", providerRef: "SBX-REF" } }),
    );
    await refundOrder("AM-20261027-00001");
    expect(db.product.update).not.toHaveBeenCalled();
  });
});

describe("paiement — validation atomique", () => {
  it("valide une commande en attente de paiement", async () => {
    db.order.findUnique.mockResolvedValue(makeOrder());
    const result = await markOrderPaid("AM-20261027-00001", { providerRef: "SBX-REF", amount: 12500 });
    expect(result).toEqual({ changed: true, status: "PAID" });
    expect(db.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "PENDING_PAYMENT", isPaid: false }) }),
    );
  });

  it("ignore un webhook rejoué sur une commande déjà payée", async () => {
    db.order.findUnique.mockResolvedValue(makeOrder({ status: "PAID", isPaid: true }));
    const result = await markOrderPaid("AM-20261027-00001");
    expect(result.changed).toBe(false);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("deux webhooks simultanés : le perdant de la course ne change rien", async () => {
    db.order.findUnique.mockResolvedValue(makeOrder());
    db.order.updateMany.mockResolvedValue({ count: 0 }); // l'autre requête est passée la première
    const result = await markOrderPaid("AM-20261027-00001");
    expect(result.changed).toBe(false);
    expect(db.orderEvent.create).not.toHaveBeenCalled();
  });

  it("rejette un montant différent du total de la commande", async () => {
    db.order.findUnique.mockResolvedValue(makeOrder());
    await expect(markOrderPaid("AM-20261027-00001", { amount: 100 })).rejects.toMatchObject({
      code: "AMOUNT_MISMATCH",
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("rejette une référence de transaction incohérente", async () => {
    db.order.findUnique.mockResolvedValue(makeOrder());
    await expect(markOrderPaid("AM-20261027-00001", { providerRef: "AUTRE" })).rejects.toMatchObject({
      code: "REF_MISMATCH",
    });
  });
});

describe("paiement échoué ou abandonné", () => {
  it("annule la commande, marque le paiement FAILED et restitue le stock", async () => {
    db.order.findUnique.mockResolvedValue(makeOrder());
    const result = await markPaymentFailed("AM-20261027-00001", { providerRef: "SBX-REF", reason: "Solde insuffisant" });
    expect(result.status).toBe("CANCELLED");
    expect(db.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "FAILED", failureReason: "Solde insuffisant" }) }),
    );
    expect(db.product.update).toHaveBeenCalled();
  });

  it("n'annule jamais une commande déjà payée", async () => {
    db.order.findUnique.mockResolvedValue(makeOrder({ status: "PAID", isPaid: true }));
    const result = await markPaymentFailed("AM-20261027-00001");
    expect(result.changed).toBe(false);
    expect(db.product.update).not.toHaveBeenCalled();
  });

  it("handlePaymentEvent route FAILED vers l'annulation", async () => {
    db.order.findUnique.mockResolvedValue(makeOrder());
    const result = await handlePaymentEvent({ orderNumber: "AM-20261027-00001", providerRef: "SBX-REF", status: "FAILED" });
    expect(result.status).toBe("CANCELLED");
  });
});

describe("expiration des commandes impayées", () => {
  it("annule les commandes périmées et libère leur stock", async () => {
    db.order.findMany.mockResolvedValue([{ number: "AM-1" }, { number: "AM-2" }]);
    db.order.findUnique.mockImplementation(async ({ where }: { where: { number: string } }) =>
      makeOrder({ number: where.number }),
    );
    const released = await expireUnpaidOrders(30);
    expect(released).toBe(2);
    expect(db.product.update).toHaveBeenCalledTimes(2);
    expect(db.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "PENDING_PAYMENT", isPaid: false }) }),
    );
  });

  it("continue même si une commande échoue", async () => {
    db.order.findMany.mockResolvedValue([{ number: "AM-1" }, { number: "AM-2" }]);
    db.order.findUnique
      .mockResolvedValueOnce(null) // AM-1 introuvable → erreur absorbée
      .mockResolvedValueOnce(makeOrder({ number: "AM-2" }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await expireUnpaidOrders(30)).toBe(1);
  });
});

describe("statuts — livraison et paiement à la livraison", () => {
  it("encaisse un paiement à la livraison lorsque la commande est livrée", async () => {
    db.order.findUnique.mockResolvedValue(makeOrder({ status: "IN_TRANSIT", paymentMethod: "cash" }));
    await transitionOrder("o1", "DELIVERED");
    expect(db.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "DELIVERED", isPaid: true }) }),
    );
    expect(db.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PAID" }) }),
    );
  });

  it("refuse une transition hors matrice", async () => {
    db.order.findUnique.mockResolvedValue(makeOrder({ status: "PREPARING" }));
    await expect(transitionOrder("o1", "PENDING_PAYMENT")).rejects.toThrow(/Transition invalide/);
  });
});

describe("numéro de commande", () => {
  it("repart du plus grand numéro du jour", async () => {
    db.order.findFirst.mockResolvedValue({ number: "AM-20261027-00041" });
    const n = await generateOrderNumber(new Date("2026-10-27T10:00:00Z"));
    expect(n).toBe("AM-20261027-00042");
  });

  it("commence à 00001 le premier jour", async () => {
    db.order.findFirst.mockResolvedValue(null);
    const n = await generateOrderNumber(new Date("2026-10-27T10:00:00Z"));
    expect(n).toBe("AM-20261027-00001");
  });
});
