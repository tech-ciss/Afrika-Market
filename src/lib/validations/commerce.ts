import { z } from "zod";
import { deliveryMethodSchema, paymentMethodSchema } from "./enums";
import { emailSchema, phoneSchema } from "./auth";

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional(),
  quantity: z.coerce.number().int().min(1, "Quantité minimale : 1").max(99),
});

export const updateCartItemSchema = z.object({
  lineId: z.string().min(1),
  quantity: z.coerce.number().int().min(0).max(99),
});

export const addressSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1).max(40).default("Domicile"),
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  phone: phoneSchema,
  country: z.string().trim().min(2).max(60).default("Côte d'Ivoire"),
  city: z.string().trim().min(2).max(60),
  district: z.string().trim().min(1).max(60),
  neighborhood: z.string().trim().max(80).optional().or(z.literal("")),
  street: z.string().trim().min(3).max(200),
  additionalInfo: z.string().trim().max(300).optional().or(z.literal("")),
  isDefault: z.coerce.boolean().default(false),
});

/**
 * Checkout : jamais de prix côté client.
 * Le client n'envoie que les références (zone, mode, moyen de paiement) ;
 * les montants sont recalculés en base au moment de la création de commande.
 */
export const checkoutSchema = z.object({
  email: emailSchema,
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  phone: phoneSchema,
  street: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(60),
  district: z.string().trim().min(1).max(60),
  neighborhood: z.string().trim().max(80).optional().or(z.literal("")),
  additionalInfo: z.string().trim().max(300).optional().or(z.literal("")),
  zoneId: z.string().min(1, "Zone de livraison requise"),
  deliveryMethod: deliveryMethodSchema.default("HOME"),
  paymentMethod: paymentMethodSchema,
  addressId: z.string().optional().nullable(),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  promoCode: z.string().trim().max(30).optional().or(z.literal("")),
  /** Token de commande invité retourné après création. */
  guestToken: z.string().optional(),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
