"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getPaymentProvider, isSandboxEnabled, signWebhookPayload } from "@/lib/services/payment.service";
import { handlePaymentEvent } from "@/lib/services/order.service";

/**
 * Simulation du retour d'un prestataire Mobile Money / carte (mode démo uniquement).
 *
 * Le navigateur n'indique jamais « payé » : l'action joue le rôle du prestataire,
 * construit un évènement SIGNÉ, le fait vérifier par le provider puis l'applique par
 * le même chemin que le vrai webhook (handlePaymentEvent). Le montant envoyé est
 * celui enregistré en base, jamais celui d'un champ de formulaire.
 */
export async function simulatePaymentAction(formData: FormData): Promise<void> {
  if (!isSandboxEnabled()) redirect("/");

  const providerRef = String(formData.get("providerRef") ?? "");
  const guestToken = String(formData.get("t") ?? "");
  const outcome = formData.get("outcome") === "FAILED" ? "FAILED" : "PAID";

  const payment = providerRef
    ? await prisma.payment.findUnique({ where: { providerRef }, include: { order: { select: { number: true } } } })
    : null;
  if (!payment) redirect("/");

  const payload = JSON.stringify({
    orderNumber: payment.order.number,
    providerRef,
    status: outcome,
    amount: payment.amount,
    ...(outcome === "FAILED" ? { failureReason: "Paiement refusé (simulation)" } : {}),
  });

  const provider = getPaymentProvider("sandbox");
  const event = provider.verifyWebhookSignature(payload, signWebhookPayload(payload))
    ? provider.parseWebhook(payload)
    : null;

  if (event) {
    try {
      await handlePaymentEvent(event);
    } catch (e) {
      console.error("[sandbox] évènement de paiement refusé :", e);
    }
  }

  const params = new URLSearchParams({ num: payment.order.number });
  if (guestToken) params.set("t", guestToken);
  redirect(`/confirmation?${params.toString()}`);
}
