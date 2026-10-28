import { describe, expect, it } from "vitest";
import {
  addLine,
  changeQuantity,
  clearLines,
  computeItemCount,
  computeSubtotal,
  mergeCarts,
  removeLine,
  validateStock,
  type CartLine,
} from "@/lib/services/cart.service";

function line(overrides: Partial<CartLine> = {}): CartLine {
  return {
    id: "l1",
    productId: "p1",
    variantId: null,
    name: "Noix de cajou premium 500 g",
    slug: "noix-de-cajou",
    image: "/images/products/x.svg",
    unit: "sachet",
    producerName: "Saveurs de Korhogo",
    producerId: "prod1",
    unitPrice: 5500,
    compareAtPrice: null,
    availableStock: 10,
    quantity: 1,
    ...overrides,
  };
}

describe("panier — ajout", () => {
  it("ajoute un produit au panier", () => {
    const result = addLine([], line(), 1, "line-1");
    expect(result.error).toBeUndefined();
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]!.quantity).toBe(1);
  });

  it("fusionne les quantités d'un même produit", () => {
    const { lines } = addLine([line({ quantity: 2 })], line(), 3, "line-1");
    expect(lines[0]!.quantity).toBe(5);
    expect(lines).toHaveLength(1);
  });

  it("refuse une quantité invalide", () => {
    const result = addLine([], line(), 0, "line-1");
    expect(result.error).toBe("QUANTITE_INVALIDE");
  });

  it("refuse un produit en rupture", () => {
    const result = addLine([], line({ availableStock: 0 }), 1, "line-1");
    expect(result.error).toBe("PRODUIT_INDISPONIBLE");
  });
});

describe("panier — stock insuffisant", () => {
  it("bloque une quantité supérieure au stock", () => {
    const result = addLine([], line({ availableStock: 3 }), 5, "line-1");
    expect(result.error).toBe("STOCK_INSUFFISANT");
    expect(result.available).toBe(3);
    expect(result.lines).toHaveLength(0);
  });

  it("bloque un dépassement lors d'une modification de quantité", () => {
    const result = changeQuantity([line({ quantity: 2, availableStock: 3 })], "l1", 6);
    expect(result.error).toBe("STOCK_INSUFFISANT");
    expect(result.available).toBe(3);
    expect(result.lines[0]!.quantity).toBe(2); // le panier n'est pas modifié
  });

  it("détecte toutes les lignes en défaut", () => {
    const issues = validateStock([
      line({ id: "a", quantity: 5, availableStock: 10 }),
      line({ id: "b", quantity: 8, availableStock: 4 }),
    ]);
    expect(issues.ok).toBe(false);
    expect(issues.issues).toHaveLength(1);
    expect(issues.issues[0]).toMatchObject({ lineId: "b", requested: 8, available: 4 });
  });
});

describe("panier — quantité et suppression", () => {
  it("supprime une ligne avec la quantité 0", () => {
    const result = changeQuantity([line()], "l1", 0);
    expect(result.lines).toHaveLength(0);
  });

  it("retire une ligne existante", () => {
    const result = removeLine([line()], "l1");
    expect(result.lines).toHaveLength(0);
  });

  it("signale une ligne introuvable", () => {
    const result = removeLine([line()], "inconnue");
    expect(result.error).toBe("LIGNE_INTROUVABLE");
  });

  it("vide entièrement le panier", () => {
    expect(clearLines()).toEqual([]);
  });
});

describe("panier — calculs", () => {
  it("calcule le sous-total", () => {
    const lines = [line({ quantity: 2, unitPrice: 5500 }), line({ id: "l2", productId: "p2", quantity: 3, unitPrice: 1500 })];
    expect(computeSubtotal(lines)).toBe(11000 + 4500);
  });

  it("calcule le nombre d'articles", () => {
    const lines = [line({ quantity: 2 }), line({ id: "l2", productId: "p2", quantity: 3 })];
    expect(computeItemCount(lines)).toBe(5);
  });

  it("retourne 0 pour un panier vide", () => {
    expect(computeSubtotal([])).toBe(0);
    expect(computeItemCount([])).toBe(0);
  });
});

describe("panier — fusion invité / connecté (§10)", () => {
  it("fusionne les quantités d'une ligne présente des deux côtés", () => {
    const merged = mergeCarts([line({ quantity: 2 })], [line({ quantity: 3 })]);
    expect(merged.lines[0]!.quantity).toBe(5);
  });

  it("plafonne la fusion au stock disponible", () => {
    const merged = mergeCarts([line({ quantity: 4, availableStock: 5 })], [line({ quantity: 4 })]);
    expect(merged.lines[0]!.quantity).toBe(5);
  });

  it("ajoute les lignes invitées absentes du panier serveur", () => {
    const merged = mergeCarts([], [line({ quantity: 2 })]);
    expect(merged.lines).toHaveLength(1);
    expect(merged.lines[0]!.quantity).toBe(2);
  });

  it("ignore une ligne invitée en rupture", () => {
    const merged = mergeCarts([], [line({ availableStock: 0 })]);
    expect(merged.lines).toHaveLength(0);
  });
});
