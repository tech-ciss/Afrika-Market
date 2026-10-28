import { describe, expect, it } from "vitest";
import { computeShippingFee, estimateDeliveryDate, resolveZone, type ZoneFeeRule } from "@/lib/services/delivery.service";

const abidjan: ZoneFeeRule = {
  name: "Abidjan",
  basePrice: 1500,
  freeFrom: 50000,
  estimatedDays: 1,
  allowCashOnDelivery: true,
  isActive: true,
};

describe("livraison — calcul des frais (§15)", () => {
  it("applique le tarif fixe de la zone", () => {
    const result = computeShippingFee({ zone: abidjan, subtotal: 12000, method: "HOME" });
    expect(result.fee).toBe(1500);
    expect(result.estimatedDays).toBe(1);
  });

  it("offre la livraison au-delà du seuil", () => {
    const result = computeShippingFee({ zone: abidjan, subtotal: 50000, method: "HOME" });
    expect(result.fee).toBe(0);
    expect(result.freeReason).toBe("SEUIL_ATTEINT");
  });

  it("offre la livraison avec un code promo dédié", () => {
    const result = computeShippingFee({ zone: abidjan, subtotal: 5000, method: "HOME", freeShippingPromo: true });
    expect(result.fee).toBe(0);
    expect(result.freeReason).toBe("PROMO");
  });

  it("rend le retrait chez le producteur gratuit", () => {
    const result = computeShippingFee({ zone: abidjan, subtotal: 2000, method: "PICKUP_PRODUCER" });
    expect(result.fee).toBe(0);
    expect(result.freeReason).toBe("RETRAIT");
  });

  it("rend le point partenaire gratuit", () => {
    const result = computeShippingFee({ zone: abidjan, subtotal: 2000, method: "PICKUP_PARTNER" });
    expect(result.fee).toBe(0);
  });

  it("reste au tarif de base juste sous le seuil", () => {
    const result = computeShippingFee({ zone: abidjan, subtotal: 49999, method: "HOME" });
    expect(result.fee).toBe(1500);
  });

  it("gère une zone absente", () => {
    const result = computeShippingFee({ zone: null, subtotal: 10000, method: "HOME" });
    expect(result.fee).toBe(0);
  });

  it("gère une zone inactive", () => {
    const result = computeShippingFee({ zone: { ...abidjan, isActive: false }, subtotal: 10000, method: "HOME" });
    expect(result.fee).toBe(0);
  });
});

describe("livraison — estimation et résolution de zone", () => {
  it("calcule une date d'estimation", () => {
    const from = new Date("2026-10-27T10:00:00Z");
    expect(estimateDeliveryDate(3, from).getDate()).toBe(30);
  });

  it("retrouve une zone depuis la ville", () => {
    const zones = [{ ...abidjan, id: "z1", countryId: "ci", description: null, districts: [{ name: "Cocody" }] }];
    expect(resolveZone(zones, "Abidjan", "Cocody")?.id).toBe("z1");
  });

  it("retrouve une zone depuis le district", () => {
    const zones = [{ ...abidjan, id: "z1", countryId: "ci", description: null, districts: [{ name: "Cocody" }] }];
    expect(resolveZone(zones, "Autre ville", "Cocody")?.id).toBe("z1");
  });

  it("retourne null si aucune zone ne correspond", () => {
    const zones = [{ ...abidjan, id: "z1", countryId: "ci", description: null, districts: [{ name: "Cocody" }] }];
    expect(resolveZone(zones, "Bouaké", "Inconnu")).toBeNull();
  });
});
