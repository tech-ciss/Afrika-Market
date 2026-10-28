import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MapPin, Package, Truck } from "lucide-react";
import { getOrderByNumber, getOrderForGuest } from "@/lib/services/order.service";
import { getCurrentUser, isStaff } from "@/lib/auth/guards";
import { isSandboxEnabled } from "@/lib/services/payment.service";
import { formatFCFA, formatDateTimeFR, parseJsonObject } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/validations/enums";
import { Alert, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/surfaces";

export const metadata: Metadata = { title: "Commande confirmée" };

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ num?: string; t?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();

  // Contrôle de propriétaire : un numéro de commande est séquentiel donc devinable ; il ne suffit jamais.
  //  - client connecté : seulement SES commandes (ou personnel de la plateforme) ;
  //  - invité (ou commande invité ouverte depuis un compte) : jeton de suivi obligatoire.
  const byNumber = user && sp.num ? await getOrderByNumber(sp.num) : null;
  const ownedByUser = byNumber && user && (byNumber.userId === user.id || isStaff(user.role)) ? byNumber : null;
  const order =
    ownedByUser ?? (sp.num && sp.t ? await getOrderForGuest(sp.num, sp.t) : null);

  if (!order) {
    return (
      <div className="container-page py-16">
        <Alert tone="warning">
          Commande introuvable. Vérifiez le reçu reçu par e-mail ou retrouvez vos commandes depuis votre espace client.
        </Alert>
        <div className="mt-4 flex gap-3">
          <Link href="/" className="btn-primary btn-md">
            Retour à l&apos;accueil
          </Link>
          <Link href="/compte/commandes" className="btn-secondary btn-md">
            Mes commandes
          </Link>
        </div>
      </div>
    );
  }

  const awaitingPayment = order.status === "PENDING_PAYMENT" && !order.isPaid;
  const cancelled = order.status === "CANCELLED";
  const payHref =
    awaitingPayment && order.payment?.providerRef && isSandboxEnabled()
      ? `/paiement/${order.payment.providerRef}${sp.t ? `?t=${sp.t}` : ""}`
      : null;
  const address = parseJsonObject<Record<string, string>>(order.shippingAddress, {});
  const delivery = order.delivery;

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-100 text-forest-700">
            <CheckCircle2 className="h-9 w-9" aria-hidden />
          </span>
          <h1 className="mt-4 text-3xl font-bold text-earth-900">Merci {address.firstName ?? ""} !</h1>
          <p className="mt-2 text-earth-600">
            Votre commande <span className="font-bold text-brand-700">{order.number}</span> a bien été enregistrée.
          </p>
          <p className="mt-1 text-sm text-earth-500">Passée le {formatDateTimeFR(order.createdAt)}</p>
        </div>

        {awaitingPayment ? (
          <Alert tone="warning" className="mt-6">
            <p className="font-semibold">Paiement en attente</p>
            <p className="mt-1">
              Votre commande sera confirmée dès réception du paiement. Sans paiement, elle sera annulée
              automatiquement et les articles remis en vente.
            </p>
            {payHref ? (
              <Link href={payHref} className="btn-primary btn-md mt-3 inline-flex">
                Payer maintenant
              </Link>
            ) : null}
          </Alert>
        ) : null}
        {cancelled ? (
          <Alert tone="error" className="mt-6">
            Cette commande a été annulée (paiement non abouti ou délai dépassé). Vous pouvez repasser commande depuis
            la boutique.
          </Alert>
        ) : null}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Détail de la commande</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-earth-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-earth-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl || "/images/products/placeholder.svg"} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-earth-900">{item.productName}</span>
                    <span className="block text-xs text-earth-500">
                      {item.producerName} · {item.origin}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-earth-600">× {item.quantity}</span>
                  <span className="w-28 shrink-0 text-right text-sm font-semibold text-earth-900">
                    {formatFCFA(item.total)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-earth-100 pt-4 text-sm">
              <div className="flex justify-between text-earth-600">
                <dt>Sous-total</dt>
                <dd>{formatFCFA(order.subtotal)}</dd>
              </div>
              {order.discount > 0 ? (
                <div className="flex justify-between text-forest-700">
                  <dt>Remise {order.promoCode ? `(${order.promoCode})` : ""}</dt>
                  <dd>-{formatFCFA(order.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between text-earth-600">
                <dt>Livraison</dt>
                <dd>{order.shippingCost === 0 ? "Offerte" : formatFCFA(order.shippingCost)}</dd>
              </div>
              <div className="flex justify-between border-t border-earth-100 pt-3 text-base font-bold text-earth-900">
                <dt>{order.isPaid ? "Total réglé" : "Total à régler"}</dt>
                <dd className="text-brand-700">{formatFCFA(order.total)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="text-sm">
              <p className="flex items-center gap-2 font-semibold text-earth-900">
                <Package className="h-4 w-4 text-brand-600" aria-hidden /> Statut
              </p>
              <p className="mt-1 text-earth-600">{ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}</p>
              <p className="mt-1 text-xs text-earth-500">
                Paiement : {PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod] ?? "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-sm">
              <p className="flex items-center gap-2 font-semibold text-earth-900">
                <Truck className="h-4 w-4 text-brand-600" aria-hidden /> Livraison
              </p>
              <p className="mt-1 text-earth-600">
                {delivery?.zone.name ?? address.zoneName ?? "—"}
                {delivery?.estimatedDate
                  ? ` · estimée le ${formatDateTimeFR(delivery.estimatedDate)}`
                  : ""}
              </p>
              {delivery?.trackingNumber ? (
                <p className="mt-1 text-xs text-earth-500">Suivi : {delivery.trackingNumber}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardContent className="text-sm">
            <p className="flex items-center gap-2 font-semibold text-earth-900">
              <MapPin className="h-4 w-4 text-brand-600" aria-hidden /> Adresse de livraison
            </p>
            <p className="mt-1 text-earth-600">
              {address.firstName} {address.lastName} · {address.street}, {address.district}, {address.city}
            </p>
            <p className="text-xs text-earth-500">{address.phone}</p>
          </CardContent>
        </Card>

        {!user ? (
          <Alert tone="info" className="mt-5">
            Conservez ce lien pour suivre votre commande : aucun compte n&apos;est nécessaire.
          </Alert>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {user ? (
            <Link href={`/compte/commandes/${order.number}`} className="btn-primary btn-md">
              Suivre ma commande
            </Link>
          ) : null}
          <Link href="/produits" className="btn-secondary btn-md">
            Continuer mes achats
          </Link>
          <Link href="/" className="btn-ghost btn-md">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
