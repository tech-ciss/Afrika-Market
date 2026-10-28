import { z } from "zod";
import { userRoleSchema } from "./enums";

/** Téléphones ouest-africains : 10 chiffres en CI, ou +225 XX XX XX XX XX */
export const phoneSchema = z
  .string()
  .trim()
  .min(8, "Numéro trop court")
  .max(20)
  .regex(/^(?:\+?225)?[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}$/, "Numéro invalide");

export const emailSchema = z.string().trim().toLowerCase().email("Adresse e-mail invalide").max(160);

export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .max(72, "Mot de passe trop long")
  .regex(/[a-zA-Z]/, "Doit contenir au moins une lettre")
  .regex(/[0-9]/, "Doit contenir au moins un chiffre");

export const registerSchema = z.object({
  firstName: z.string().trim().min(2, "Prénom requis").max(60),
  lastName: z.string().trim().min(2, "Nom requis").max(60),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  /** Un producteur crée son compte producteur, un client son compte client. */
  intent: z.enum(["client", "producteur"]).default("client"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis"),
});

export const profileSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  phone: phoneSchema.optional().or(z.literal("")),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export const roleSchema = userRoleSchema;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
