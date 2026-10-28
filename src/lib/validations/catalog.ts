import { z } from "zod";
import { promoScopeSchema, promoTypeSchema, reviewStatusSchema } from "./enums";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(90)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug invalide (minuscules, chiffres, tirets)");

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(60),
  slug: slugSchema,
  description: z.string().trim().max(500).optional().or(z.literal("")),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  parentId: z.string().optional().nullable(),
  position: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.coerce.boolean().default(true),
});

/** Champs d'origine / traçabilité (module « Origine et traçabilité »). */
const originFields = {
  countryId: z.string().min(1, "Pays requis"),
  region: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  originMethod: z.string().trim().max(300).optional().or(z.literal("")),
  harvestPeriod: z.string().trim().max(80).optional().or(z.literal("")),
  conservation: z.string().trim().max(300).optional().or(z.literal("")),
};

export const productSchema = z.object({
  name: z.string().trim().min(3, "Nom requis").max(140),
  slug: slugSchema,
  categoryId: z.string().min(1, "Catégorie requise"),
  shortDescription: z.string().trim().min(10, "Description courte trop courte").max(220),
  description: z.string().trim().min(20, "Description trop courte").max(5000),
  price: z.coerce.number().int().min(1, "Prix requis").max(100_000_000),
  compareAtPrice: z.coerce.number().int().min(0).nullable().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  unit: z.string().trim().min(1).max(30),
  weight: z.coerce.number().int().min(0).nullable().optional(),
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  tags: z.string().trim().max(300).optional().or(z.literal("")),
  images: z.array(z.string().trim().url("URL d'image invalide")).max(8).default([]),
  characteristics: z.array(z.object({ label: z.string().max(60), value: z.string().max(120) })).max(12).default([]),
  ...originFields,
  isActive: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
});

export const variantSchema = z.object({
  name: z.string().trim().min(1).max(60),
  sku: z.string().trim().min(3).max(60),
  price: z.coerce.number().int().min(1),
  stock: z.coerce.number().int().min(0),
  attributes: z.record(z.string().max(50), z.string().max(60)).default({}),
  isActive: z.coerce.boolean().default(true),
});

export const producerProfileSchema = z.object({
  name: z.string().trim().min(3, "Nom requis").max(120),
  description: z.string().trim().min(20, "Présentation trop courte").max(1200),
  story: z.string().trim().max(4000).optional().or(z.literal("")),
  countryId: z.string().min(1, "Pays requis"),
  region: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  specialties: z.string().trim().max(300).optional().or(z.literal("")),
  certifications: z.string().trim().max(300).optional().or(z.literal("")),
  logoUrl: z.string().trim().url().optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Note minimale : 1").max(5, "Note maximale : 5"),
  comment: z.string().trim().min(10, "Avis trop court (10 caractères min.)").max(2000),
});

export const reviewModerationSchema = z.object({
  reviewId: z.string().min(1),
  status: reviewStatusSchema,
  reply: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const promoCodeSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .transform((v) => v.toUpperCase())
      .refine((v) => /^[A-Z0-9_-]+$/.test(v), "Caractères autorisés : A-Z, 0-9, - , _"),
    description: z.string().trim().max(200).optional().or(z.literal("")),
    type: promoTypeSchema,
    scope: promoScopeSchema.default("GLOBAL"),
    value: z.coerce.number().int().min(0).max(100_000),
    minimumAmount: z.coerce.number().int().min(0).default(0),
    maximumUses: z.coerce.number().int().min(1).nullable().optional(),
    maximumUsesPerUser: z.coerce.number().int().min(1).nullable().optional(),
    productId: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date().nullable().optional(),
    isActive: z.coerce.boolean().default(true),
  })
  .superRefine((v, ctx) => {
    if (v.type === "PERCENTAGE" && (v.value < 1 || v.value > 100)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: "Pourcentage entre 1 et 100" });
    }
    if (v.scope === "PRODUCT" && !v.productId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["productId"], message: "Produit requis pour cette portée" });
    }
    if (v.scope === "CATEGORY" && !v.categoryId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["categoryId"], message: "Catégorie requise pour cette portée" });
    }
    if (v.endsAt && v.endsAt.getTime() <= v.startsAt.getTime()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endsAt"], message: "La date de fin doit suivre le début" });
    }
  });

export const deliveryZoneSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  countryId: z.string().min(1),
  basePrice: z.coerce.number().int().min(0),
  freeFrom: z.coerce.number().int().min(0).nullable().optional(),
  estimatedDays: z.coerce.number().int().min(0).max(60).default(2),
  allowCashOnDelivery: z.coerce.boolean().default(true),
  isActive: z.coerce.boolean().default(true),
  districts: z.array(z.string().trim().min(1).max(60)).max(60).default([]),
});

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide"),
});

export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ProducerProfileInput = z.infer<typeof producerProfileSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type PromoCodeInput = z.infer<typeof promoCodeSchema>;
export type DeliveryZoneInput = z.infer<typeof deliveryZoneSchema>;
