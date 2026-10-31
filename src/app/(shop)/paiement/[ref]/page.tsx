import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, Smartphone } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { isSandboxEnabled } from "@/lib/services/payment.service";
import { simulatePaymentAction } from "@/actions/payment";
import { formatFCFA } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/validations/enums";
import { Alert } from "@/components/ui/surfaces";
import { CheckoutSteps } from "@/components/features/checkout-steps";

export const metadata: Metadata = { title: "Paiement (simulation)", robots: { index: false, follow: false } };

/**
 * Page de paiement de DÉMONSTRATION. Elle remplace la page du prestataire
 * (Wave, Orange Money, MTN, Moov…) tant qu'aucune intégration réelle n'est branchée.
 * Elle n'existe que si PAYMENT_PROVIDER=sandbox.
 */
export default async function SandboxPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  if (!isSandboxEnabled()) notFound();

  const { ref } = await params;
  const { t } = await searchParams;

  const payment = await prisma.payment.findUnique({
    where: { providerRef: ref },
    include: { order: { select: { number: true, status: true, paymentMethod: true } } },
  });
  if (!payment) notFound();

  const { order } = payment;
  const pending = order.status === "PENDING_PAYMENT" && payment.status === "PENDING";
  const confirmationHref = `/confirmation?num=${order.number}${t ? `&t=${t}` : ""}`;
  const methodLabel = PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod] ?? "Paiement";

  const isMobileMoney = ["wave", "orange", "mtn", "moov"].includes(order.paymentMethod);

  return (
    <div className="container-page py-8 sm:py-10">
      <CheckoutSteps current={2} />
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-2xl border border-earth-200 bg-white shadow-lift">
          <div className="on-dark bg-brand-900 px-6 pb-6 pt-5 text-white">
            <h1 className="flex items-center gap-2 font-sans text-sm font-semibold tracking-normal text-sun-300">
              <Smartphone className="h-4 w-4" aria-hidden /> Paiement {methodLabel}
            </h1>
            <p className="mt-4 text-sm text-white/70">Montant à payer</p>
            <p className="font-display text-5xl font-extrabold tracking-tight text-white">{formatFCFA(payment.amount)}</p>
            <p className="mt-2 text-xs text-white/60">Commande {order.number}</p>
          </div>
          <div className="weave" aria-hidden />

          <div className="space-y-4 p-6 text-sm">
            <Alert tone="info">
              Mode démonstration : aucun argent n&apos;est débité. Choisissez l&apos;issue du paiement à simuler.
            </Alert>

            {pending ? (
              <>
                <p className="text-earth-600">
                  {isMobileMoney
                    ? "En réel, vous recevriez une demande de confirmation sur votre téléphone. Ici, vous la simulez."
                    : "En réel, vous saisiriez les informations de votre carte sur la page sécurisée du prestataire."}
                </p>
                <form action={simulatePaymentAction} className="grid gap-3">
                  <input type="hidden" name="providerRef" value={ref} />
                  <input type="hidden" name="t" value={t ?? ""} />
                  <button type="submit" name="outcome" value="PAID" className="btn-primary btn-lg w-full">
                    <ShieldCheck className="h-5 w-5" aria-hidden /> Confirmer le paiement
                  </button>
                  <button type="submit" name="outcome" value="FAILED" className="btn-secondary btn-md w-full">
                    Simuler un échec
                  </button>
                </form>
              </>
            ) : (
              <div className="space-y-3">
                <Alert tone="warning">Ce paiement n&apos;est plus en attente (statut de la commande : {order.status}).</Alert>
                <Link href={confirmationHref} className="btn-primary btn-md w-full">
                  Voir ma commande
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
