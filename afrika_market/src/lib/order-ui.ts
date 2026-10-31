import type { DeliveryStatus, OrderStatus } from "@/lib/validations/enums";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "brand" | "info";

/** Couleur de pastille d'un statut de commande, commune à l'espace vendeur, l'admin et le compte client. */
export function orderStatusTone(status: OrderStatus | string): BadgeTone {
  switch (status) {
    case "DELIVERED":
      return "success";
    case "PENDING_PAYMENT":
      return "warning";
    case "CANCELLED":
    case "REFUNDED":
      return "danger";
    case "PAID":
    case "CONFIRMED":
    case "PREPARING":
    case "READY_FOR_DELIVERY":
    case "IN_TRANSIT":
      return "brand";
    default:
      return "neutral";
  }
}

export function deliveryStatusTone(status: DeliveryStatus | string): BadgeTone {
  if (status === "DELIVERED") return "success";
  if (status === "FAILED" || status === "CANCELLED") return "danger";
  if (status === "PENDING") return "warning";
  return "brand";
}

/** Commandes qui attendent une action du producteur. */
export const ACTIONABLE_STATUSES: OrderStatus[] = ["PAID", "CONFIRMED", "PREPARING", "READY_FOR_DELIVERY"];
