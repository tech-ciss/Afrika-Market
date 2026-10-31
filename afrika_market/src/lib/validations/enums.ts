import { z } from "zod";

/**
 * Statuts du cahier des charges.
 * SQLite ne supporte pas les enums Prisma : on les modélise en String et on
 * les valide côté serveur avec ces schémas (portable vers PostgreSQL).
 */

export const USER_ROLES = ["CLIENT", "PRODUCER", "ADMIN", "SUPER_ADMIN"] as const;
export const userRoleSchema = z.enum(USER_ROLES);
export type UserRole = z.infer<typeof userRoleSchema>;

export const PRODUCER_STATUSES = ["PENDING", "APPROVED", "SUSPENDED", "REJECTED"] as const;
export const producerStatusSchema = z.enum(PRODUCER_STATUSES);
export type ProducerStatus = z.infer<typeof producerStatusSchema>;

export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_DELIVERY",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const PAYMENT_STATUSES = [
  "PENDING",
  "PROCESSING",
  "PAID",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
] as const;
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const DELIVERY_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "IN_TRANSIT",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
] as const;
export const deliveryStatusSchema = z.enum(DELIVERY_STATUSES);
export type DeliveryStatus = z.infer<typeof deliveryStatusSchema>;

export const DELIVERY_METHODS = ["HOME", "RELAY_POINT", "PICKUP_PRODUCER", "PICKUP_PARTNER"] as const;
export const deliveryMethodSchema = z.enum(DELIVERY_METHODS);
export type DeliveryMethod = z.infer<typeof deliveryMethodSchema>;

export const REVIEW_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export const reviewStatusSchema = z.enum(REVIEW_STATUSES);
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;

export const PROMO_TYPES = ["PERCENTAGE", "FIXED", "FREE_SHIPPING"] as const;
export const promoTypeSchema = z.enum(PROMO_TYPES);
export type PromoType = z.infer<typeof promoTypeSchema>;

export const PROMO_SCOPES = ["GLOBAL", "PRODUCT", "CATEGORY"] as const;
export const promoScopeSchema = z.enum(PROMO_SCOPES);
export type PromoScope = z.infer<typeof promoScopeSchema>;

/** Moyens de paiement prévus par le cahier des charges (module E). */
export const PAYMENT_METHODS = ["wave", "orange", "mtn", "moov", "card", "cash"] as const;
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

/** Libellés français des statuts, pour l'UI. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "En attente de paiement",
  PAID: "Payée",
  CONFIRMED: "Confirmée",
  PREPARING: "Préparation",
  READY_FOR_DELIVERY: "Prête pour l'expédition",
  IN_TRANSIT: "En cours de livraison",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "En attente",
  PROCESSING: "En cours",
  PAID: "Payé",
  FAILED: "Échoué",
  CANCELLED: "Annulé",
  REFUNDED: "Remboursé",
};

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  PREPARING: "En préparation",
  READY: "Prête",
  IN_TRANSIT: "En transit",
  DELIVERED: "Livrée",
  FAILED: "Échec",
  CANCELLED: "Annulée",
};

export const PRODUCER_STATUS_LABELS: Record<ProducerStatus, string> = {
  PENDING: "En attente de validation",
  APPROVED: "Approuvé",
  SUSPENDED: "Suspendu",
  REJECTED: "Rejeté",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  wave: "Wave",
  orange: "Orange Money",
  mtn: "MTN Mobile Money",
  moov: "Moov Money",
  card: "Carte bancaire",
  cash: "Paiement à la livraison",
};

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  HOME: "Livraison à domicile",
  RELAY_POINT: "Point relais",
  PICKUP_PRODUCER: "Retrait chez le producteur",
  PICKUP_PARTNER: "Retrait en point partenaire",
};
