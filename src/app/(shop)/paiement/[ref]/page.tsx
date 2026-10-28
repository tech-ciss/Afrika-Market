import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, Smartphone } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { isSandboxEnabled } from "@/lib/services/payment.service";
import { simulatePaymentAction } from "@/actions/payment";
import { formatFCFA } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/validations/enums";
import { Alert, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/surfaces";

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

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-brand-600" aria-hidden /> {methodLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Alert tone="info">
              Mode démonstration : aucun argent n&apos;est débité. Choisissez l&apos;issue du paiement à simuler.
            </Alert>

            <dl className="space-y-1">
              <div className="flex justify-between">
                <dt className="text-earth-600">Commande</dt>
                <dd className="font-semibold text-earth-900">{order.number}</dd>
              </div>
              <div className="flex justify-between border-t border-earth-100 pt-2 text-base">
                <dt className="font-semibold text-earth-900">Montant à payer</dt>
                <dd className="font-bold text-brand-700">{formatFCFA(payment.amount)}</dd>
              </div>
            </dl>

            {pending ? (
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
            ) : (
              <div className="space-y-3">
                <Alert tone="warning">Ce paiement n&apos;est plus en attente (statut de la commande : {order.status}).</Alert>
                <Link href={confirmationHref} className="btn-primary btn-md w-full">
                  Voir ma commande
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
