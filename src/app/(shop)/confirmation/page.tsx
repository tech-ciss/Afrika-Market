import type { Metadata } from "next";
import Link from "next/link";
import { Clock, MapPin, Package, Truck } from "lucide-react";
import { getOrderByNumber, getOrderForGuest } from "@/lib/services/order.service";
import { getCurrentUser, isStaff } from "@/lib/auth/guards";
import { isSandboxEnabled } from "@/lib/services/payment.service";
import { formatFCFA, formatDateTimeFR, parseJsonObject } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/validations/enums";
import { Alert, Badge } from "@/components/ui/surfaces";
import { SmartImage } from "@/components/ui/smart-image";
import { CheckoutSteps } from "@/components/features/checkout-steps";
import { PLACEHOLDER_IMAGE } from "@/lib/images";

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
  const statusTone = cancelled || order.status === "REFUNDED" ? "danger" : awaitingPayment ? "warning" : "success";

  return (
    <div className="container-page py-8 sm:py-10">
      {cancelled ? null : <CheckoutSteps current={3} />}

      <div className="mx-auto max-w-3xl text-center">
        {/* Le « ✓ » se trace une seule fois à l'arrivée : le moment fort du parcours. */}
        <span
          className={`arch mx-auto flex h-24 w-20 items-end justify-center pb-5 ${
            cancelled ? "bg-kola-500 text-white" : awaitingPayment ? "bg-sun-400 text-brand-950" : "bg-forest-600 text-white"
          }`}
        >
          {cancelled ? (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : awaitingPayment ? (
            <Clock className="h-8 w-8" aria-hidden />
          ) : (
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" className="animate-draw [stroke-dasharray:26]" />
            </svg>
          )}
        </span>

        <h1 className="mt-6 font-display text-4xl font-extrabold sm:text-5xl">
          {cancelled ? "Commande annulée" : `Merci ${address.firstName ?? ""} !`}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-earth-600">
          {cancelled
            ? "Cette commande n'a pas abouti."
            : awaitingPayment
              ? "Votre commande est enregistrée. Il ne reste qu'à régler pour la confirmer."
              : "Votre commande a bien été enregistrée. Les producteurs s'occupent du reste."}
        </p>
        <p className="mt-5 inline-flex items-center gap-3 rounded-full border-2 border-dashed border-sun-400 bg-sun-50 px-5 py-2">
          <span className="text-xs text-earth-600">Commande</span>
          <span className="font-display text-lg font-extrabold tracking-tight text-brand-900">{order.number}</span>
        </p>
        <p className="mt-2 text-xs text-earth-500">Passée le {formatDateTimeFR(order.createdAt)}</p>
      </div>

      <div className="mx-auto mt-8 max-w-5xl">
        {awaitingPayment ? (
          <Alert tone="warning" className="mb-6">
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
          <Alert tone="error" className="mb-6">
            Cette commande a été annulée (paiement non abouti ou délai dépassé). Vous pouvez repasser commande depuis
            la boutique.
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* Détail de la commande */}
          <section className="rounded-2xl border border-earth-200 bg-white p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold text-brand-950">Détail de la commande</h2>
            <ul className="mt-4 divide-y divide-earth-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-earth-100">
                    <SmartImage src={item.imageUrl || PLACEHOLDER_IMAGE} alt="" fill sizes="56px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-earth-900">{item.productName}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-earth-500">
                      <MapPin className="h-3 w-3 shrink-0 text-forest-600" aria-hidden />
                      <span className="truncate">
                        {item.producerName} · {item.origin}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-earth-600">× {item.quantity}</span>
                  <span className="w-24 shrink-0 text-right text-sm font-semibold text-earth-900">{formatFCFA(item.total)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t-2 border-dashed border-earth-200 pt-4 text-sm">
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
              <div className="flex items-baseline justify-between border-t border-earth-100 pt-3">
                <dt className="font-semibold text-earth-900">{order.isPaid ? "Total réglé" : "Total à régler"}</dt>
                <dd className="font-display text-2xl font-extrabold text-brand-800">{formatFCFA(order.total)}</dd>
              </div>
            </dl>
          </section>

          {/* Suivi : statut, livraison, adresse */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-earth-200 bg-white p-5 text-sm">
              <p className="flex items-center gap-2 font-semibold text-earth-900">
                <Package className="h-4 w-4 text-brand-600" aria-hidden /> Statut
              </p>
              <p className="mt-2">
                <Badge tone={statusTone}>{ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}</Badge>
              </p>
              <p className="mt-2 text-xs text-earth-500">
                Paiement : {PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod] ?? "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-earth-200 bg-white p-5 text-sm">
              <p className="flex items-center gap-2 font-semibold text-earth-900">
                <Truck className="h-4 w-4 text-brand-600" aria-hidden /> Livraison
              </p>
              <p className="mt-2 text-earth-700">
                {delivery?.zone.name ?? address.zoneName ?? "—"}
                {delivery?.estimatedDate ? ` · estimée le ${formatDateTimeFR(delivery.estimatedDate)}` : ""}
              </p>
              {delivery?.trackingNumber ? (
                <p className="mt-1 text-xs text-earth-500">
                  Suivi : <span className="font-mono">{delivery.trackingNumber}</span>
                </p>
              ) : null}
              <p className="mt-4 flex items-center gap-2 border-t border-earth-100 pt-4 font-semibold text-earth-900">
                <MapPin className="h-4 w-4 text-brand-600" aria-hidden /> Adresse
              </p>
              <p className="mt-2 text-earth-700">
                {address.firstName} {address.lastName}
                <br />
                {address.street}, {address.district}, {address.city}
              </p>
              <p className="text-xs text-earth-500">{address.phone}</p>
            </div>
          </aside>
        </div>

        {!user ? (
          <Alert tone="info" className="mt-6">
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
