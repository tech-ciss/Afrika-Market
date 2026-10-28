"use server";

import { prisma } from "@/lib/db/prisma";
import { newsletterSchema } from "@/lib/validations/catalog";

export type NewsletterState = { ok?: boolean; error?: string };

/** Inscription newsletter (§22) — depuis le footer, l'accueil ou un popup. */
export async function subscribeNewsletterAction(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = newsletterSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "Adresse e-mail invalide." };
  }

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      update: { isActive: true },
      create: { email: parsed.data.email, source: String(formData.get("source") ?? "footer") },
    });
  } catch {
    return { error: "Une erreur est survenue, réessayez." };
  }
  return { ok: true };
}
