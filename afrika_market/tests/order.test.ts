import { describe, expect, it } from "vitest";
import { canTransition, ORDER_TRANSITIONS } from "@/lib/services/order.service";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/validations/enums";

describe("commandes — matrice de transitions (§16)", () => {
  it("autorise le parcours nominal complet", () => {
    const path: OrderStatus[] = [
      "PENDING_PAYMENT",
      "PAID",
      "CONFIRMED",
      "PREPARING",
      "READY_FOR_DELIVERY",
      "IN_TRANSIT",
      "DELIVERED",
    ];
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransition(path[i]!, path[i + 1]!), `transition ${path[i]} → ${path[i + 1]}`).toBe(true);
    }
  });

  it("autorise l'annulation depuis les états intermédiaires", () => {
    expect(canTransition("PENDING_PAYMENT", "CANCELLED")).toBe(true);
    expect(canTransition("PAID", "CANCELLED")).toBe(true);
    expect(canTransition("CONFIRMED", "CANCELLED")).toBe(true);
    expect(canTransition("PREPARING", "CANCELLED")).toBe(true);
    expect(canTransition("IN_TRANSIT", "CANCELLED")).toBe(true);
  });

  it("interdit d'annuler une commande livrée", () => {
    expect(canTransition("DELIVERED", "CANCELLED")).toBe(false);
  });

  it("interdit les sauts d'étape", () => {
    expect(canTransition("PENDING_PAYMENT", "DELIVERED")).toBe(false);
    expect(canTransition("PAID", "IN_TRANSIT")).toBe(false);
    expect(canTransition("CONFIRMED", "READY_FOR_DELIVERY")).toBe(false);
  });

  it("autorise le remboursement uniquement après livraison ou paiement", () => {
    expect(canTransition("DELIVERED", "REFUNDED")).toBe(true);
    expect(canTransition("PENDING_PAYMENT", "REFUNDED")).toBe(false);
  });

  it("traite une transition vers le même statut comme un no-op", () => {
    for (const status of ORDER_STATUSES) {
      expect(canTransition(status, status)).toBe(true);
    }
  });

  it("termine les états finaux", () => {
    expect(ORDER_TRANSITIONS.CANCELLED).toHaveLength(0);
    expect(ORDER_TRANSITIONS.REFUNDED).toHaveLength(0);
  });

  it("couvre tous les statuts du cahier des charges", () => {
    for (const status of ORDER_STATUSES) {
      expect(ORDER_TRANSITIONS[status]).toBeDefined();
      for (const target of ORDER_TRANSITIONS[status]) {
        expect(ORDER_STATUSES).toContain(target);
      }
    }
  });
});
