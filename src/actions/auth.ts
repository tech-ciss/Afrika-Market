"use server";

import { AuthError } from "next-auth";
import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { rateLimitByIp, LIMITS } from "@/lib/security/rate-limit";
import { signIn, signOut } from "@/lib/auth/config";
import { requireUser } from "@/lib/auth/guards";
import { registerSchema, profileSchema, changePasswordSchema } from "@/lib/validations/auth";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: string;
};

/** Seules les redirections internes sont acceptées (protection open redirect). */
function safeCallback(value: FormDataEntryValue | null, fallback = "/compte"): string {
  const raw = typeof value === "string" ? value : "";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return fallback;
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const rl = await rateLimitByIp("register", LIMITS.register);
  if (!rl.ok) return { error: `Trop de tentatives. Réessayez dans ${rl.retryAfter} s.` };

  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    intent: formData.get("intent") || "client",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, error: "Veuillez corriger les champs en erreur." };
  }

  const { firstName, lastName, email, phone, password, intent } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Un compte existe déjà avec cette adresse e-mail.", fieldErrors: { email: ["Déjà utilisé"] } };
  }

  const country = await prisma.country.findFirst({ where: { code: "CI" } });
  const user = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      phone,
      passwordHash: await hash(password, 12),
      role: intent === "producteur" ? "PRODUCER" : "CLIENT",
      countryId: country?.id ?? null,
    },
  });

  // Un producteur dépose sa demande de validation (statut PENDING, §9).
  if (intent === "producteur") {
    await prisma.producer.create({
      data: {
        userId: user.id,
        name: `${firstName} ${lastName}`,
        slug: `${firstName}-${lastName}-${user.id.slice(-4)}`.toLowerCase(),
        description: "Nouveau producteur — présentation à compléter depuis l'espace vendeur.",
        countryId: country?.id ?? (await prisma.country.findFirst())!.id,
        region: "À renseigner",
        city: "À renseigner",
        status: "PENDING",
      },
    });
  }

  await signIn("credentials", { email, password, redirectTo: safeCallback(formData.get("callbackUrl")) });
  return { success: "Bienvenue sur AFRIKA MARKET !" };
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const rl = await rateLimitByIp("login", LIMITS.login);
  if (!rl.ok) return { error: `Trop de tentatives. Réessayez dans ${rl.retryAfter} s.` };

  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = safeCallback(formData.get("callbackUrl"));

  if (!email || !password) {
    return { error: "E-mail et mot de passe sont obligatoires." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Identifiants incorrects ou compte désactivé." };
    }
    throw error; // redirection de succès
  }
  return {};
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, error: "Veuillez corriger les champs en erreur." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone ?? null,
    },
  });
  return { success: "Profil mis à jour." };
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, error: "Mot de passe actuel ou nouveau mot de passe invalide." };
  }

  const row = await prisma.user.findUnique({ where: { id: user.id } });
  if (!row) return { error: "Compte introuvable." };

  const valid = await compare(parsed.data.currentPassword, row.passwordHash);
  if (!valid) return { error: "Mot de passe actuel incorrect." };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hash(parsed.data.newPassword, 12) },
  });
  return { success: "Mot de passe modifié." };
}

export async function requireDashboard(): Promise<void> {
  await requireUser();
}
