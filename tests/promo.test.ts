import { describe, expect, it } from "vitest";
import { validatePromo, type PromoContext, type PromoRecord } from "@/lib/services/promo.service";

const NOW = new Date("2026-10-27T10:00:00Z");

function promo(overrides: Partial<PromoRecord> = {}): PromoRecord {
  return {
    id: "promo1",
    code: "BIENVENUE10",
    description: "-10 %",
    type: "PERCENTAGE",
    scope: "GLOBAL",
    value: 10,
    minimumAmount: 0,
    maximumUses: null,
    maximumUsesPerUser: null,
    startsAt: new Date("2026-01-01T00:00:00Z"),
    endsAt: new Date("2026-12-31T23:59:59Z"),
    isActive: true,
    productId: null,
    categoryId: null,
    ...overrides,
  };
}

function ctx(overrides: Partial<PromoContext> = {}): PromoContext {
  return {
    now: NOW,
    subtotal: 20000,
    productIds: ["p1", "p2"],
    categoryIds: ["c1"],
    usesTotal: 0,
    usesByUser: 0,
    ...overrides,
  };
}

describe("promotions — code valide", () => {
  it("applique un pourcentage", () => {
    const result = validatePromo(promo(), ctx({ subtotal: 20000 }));
    expect(result.ok).toBe(true);
    expect(result.discount).toBe(2000);
  });

  it("applique un montant fixe", () => {
    const result = validatePromo(promo({ type: "FIXED", value: 1500 }), ctx({ subtotal: 20000 }));
    expect(result.ok).toBe(true);
    expect(result.discount).toBe(1500);
  });

  it("ne dépasse jamais le sous-total", () => {
    const result = validatePromo(promo({ type: "FIXED", value: 999999 }), ctx({ subtotal: 5000 }));
    expect(result.discount).toBe(5000);
  });

  it("active la livraison offerte", () => {
    const result = validatePromo(promo({ type: "FREE_SHIPPING", value: 0 }), ctx());
    expect(result.ok).toBe(true);
    expect(result.freeShipping).toBe(true);
    expect(result.discount).toBe(0);
  });
});

describe("promotions — codes invalides", () => {
  it("rejette un code inconnu", () => {
    const result = validatePromo(null, ctx());
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("INCONNU");
  });

  it("rejette un code inactif", () => {
    const result = validatePromo(promo({ isActive: false }), ctx());
    expect(result.reason).toBe("INACTIF");
  });

  it("rejette un code expiré", () => {
    const result = validatePromo(promo({ endsAt: new Date("2026-10-01T00:00:00Z") }), ctx());
    expect(result.reason).toBe("EXPIRE");
  });

  it("rejette un code non encore débuté", () => {
    const result = validatePromo(promo({ startsAt: new Date("2026-11-01T00:00:00Z") }), ctx());
    expect(result.reason).toBe("NON_DEBUTE");
  });

  it("rejette un montant minimum non atteint", () => {
    const result = validatePromo(promo({ minimumAmount: 50000 }), ctx({ subtotal: 20000 }));
    expect(result.reason).toBe("MONTANT_MINIMUM");
  });

  it("rejette un code au-delà du nombre total d'utilisations", () => {
    const result = validatePromo(promo({ maximumUses: 10 }), ctx({ usesTotal: 10 }));
    expect(result.reason).toBe("UTILISATIONS_MAX");
  });

  it("rejette un code déjà utilisé par le client", () => {
    const result = validatePromo(promo({ maximumUsesPerUser: 1 }), ctx({ usesByUser: 1 }));
    expect(result.reason).toBe("UTILISATIONS_UTILISATEUR_MAX");
  });

  it("rejette un code produit si le produit n'est pas au panier", () => {
    const result = validatePromo(promo({ scope: "PRODUCT", productId: "autre" }), ctx());
    expect(result.reason).toBe("NON_ELIGIBLE");
  });

  it("rejette un code catégorie si la catégorie n'est pas au panier", () => {
    const result = validatePromo(promo({ scope: "CATEGORY", categoryId: "autre" }), ctx());
    expect(result.reason).toBe("NON_ELIGIBLE");
  });

  it("accepte un code produit présent au panier", () => {
    const result = validatePromo(promo({ scope: "PRODUCT", productId: "p1" }), ctx());
    expect(result.ok).toBe(true);
  });
});

describe("promotions — cas limites", () => {
  it("plafonne un pourcentage à 100 %", () => {
    const result = validatePromo(promo({ value: 150 }), ctx({ subtotal: 10000 }));
    expect(result.discount).toBe(10000);
  });

  it("reste valide exactement à la date de fin", () => {
    const p = promo({ endsAt: new Date("2026-10-27T12:00:00Z") });
    expect(validatePromo(p, ctx()).ok).toBe(true);
  });
});

describe("promotions — identification du client", () => {
  it("utilise le compte pour un client connecté", async () => {
    const { promoCustomerFilter } = await import("@/lib/services/promo.service");
    expect(promoCustomerFilter("u1", "a@b.ci")).toEqual({ userId: "u1" });
  });

  it("utilise l'e-mail normalisé pour un invité", async () => {
    const { promoCustomerFilter } = await import("@/lib/services/promo.service");
    expect(promoCustomerFilter(null, " Aya@Mail.ci ")).toEqual({ userId: null, email: "aya@mail.ci" });
  });

  it("ne peut pas limiter un client anonyme sans e-mail", async () => {
    const { promoCustomerFilter } = await import("@/lib/services/promo.service");
    expect(promoCustomerFilter(null, null)).toBeNull();
  });
});
