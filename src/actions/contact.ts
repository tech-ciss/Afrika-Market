"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { rateLimitByIp, LIMITS } from "@/lib/security/rate-limit";

export type ContactState = { ok?: boolean; error?: string };

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(120),
  email: z.string().trim().toLowerCase().email("E-mail invalide"),
  subject: z.string().trim().min(3, "Objet requis").max(160),
  message: z.string().trim().min(10, "Message trop court").max(4000),
});

export async function contactAction(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const rl = await rateLimitByIp("contact", LIMITS.contact);
  if (!rl.ok) return { error: `Trop de messages envoyés. Réessayez dans ${Math.ceil(rl.retryAfter / 60)} min.` };

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await prisma.contactMessage.create({ data: parsed.data });
  return { ok: true };
}
