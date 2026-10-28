import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Truck } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getOrderByNumber } from "@/lib/services/order.service";
import { formatFCFA, formatDateTimeFR, parseJsonObject } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/validations/enums";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/surfaces";
import { PrintButton } from "@/components/features/print-button";
import { OrderTimeline } from "@/components/features/order-timeline";

export const metadata: Metadata = { title: "Suivi de commande" };

export default async function OrderDetailPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const user = await requireUser();
  const order = await getOrderByNumber(number);
  if (!order || order.userId !== user.id) notFound();

  const address = parseJsonObject<Record<string, string>>(order.shippingAddress, {});
  const status = order.status as OrderStatus;
  const delivery = order.delivery;

  return (
    <div>
      <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-earth-500">
        <Link href="/compte/commandes" className="hover:text-brand-700">
          Mes commandes
        </Link>{" "}
        / <span className="text-earth-800">{order.number}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">{order.number}</h1>
          <p className="mt-1 text-sm text-earth-600">Passée le {formatDateTimeFR(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={status === "DELIVERED" ? "success" : status === "CANCELLED" ? "danger" : "brand"}>
            {ORDER_STATUS_LABELS[status]}
          </Badge>
          <PrintButton />
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Articles commandés (snapshot)</CardTitle>
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
                      <Link href={`/produits/${item.productSlug}`} className="block truncate text-sm font-semibold text-earth-900 hover:text-brand-700">
                        {item.productName}
                      </Link>
                      <span className="block text-xs text-earth-500">
                        {item.producerName} · {item.origin} · SKU {item.sku}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm text-earth-600">
                      {item.quantity} × {formatFCFA(item.unitPrice)}
                    </span>
                    <span className="w-24 shrink-0 text-right text-sm font-semibold text-earth-900">
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
                  <dt>Total</dt>
                  <dd className="text-brand-700">{formatFCFA(order.total)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Suivi de la commande</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline
                events={order.events.map((e) => ({
                  id: e.id,
                  status: e.status,
                  label: e.label,
                  note: e.note,
                  createdAt: e.createdAt.toISOString(),
                }))}
              />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardContent className="text-sm">
              <p className="flex items-center gap-2 font-semibold text-earth-900">
                <MapPin className="h-4 w-4 text-brand-600" aria-hidden /> Adresse de livraison
              </p>
              <p className="mt-1 text-earth-600">
                {address.firstName} {address.lastName}
              </p>
              <p className="text-earth-600">
                {address.street}
                {address.neighborhood ? `, ${address.neighborhood}` : ""}, {address.district}, {address.city}
              </p>
              <p className="mt-1 text-xs text-earth-500">{address.phone}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-sm">
              <p className="flex items-center gap-2 font-semibold text-earth-900">
                <Truck className="h-4 w-4 text-brand-600" aria-hidden /> Livraison
              </p>
              <p className="mt-1 text-earth-600">{delivery?.zone.name ?? "—"}</p>
              {delivery ? (
                <>
                  <p className="mt-1 text-xs text-earth-500">N° de suivi : {delivery.trackingNumber}</p>
                  {delivery.estimatedDate ? (
                    <p className="text-xs text-earth-500">Estimée le {formatDateTimeFR(delivery.estimatedDate)}</p>
                  ) : null}
                  {delivery.deliveredAt ? (
                    <p className="text-xs font-semibold text-forest-700">
                      Livrée le {formatDateTimeFR(delivery.deliveredAt)}
                    </p>
                  ) : null}
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-sm">
              <p className="font-semibold text-earth-900">Paiement</p>
              <p className="mt-1 text-earth-600">
                {PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod] ?? "—"}
                {order.payment ? ` · ${order.payment.status}` : ""}
              </p>
              {order.payment?.paidAt ? (
                <p className="mt-1 text-xs text-forest-700">Payé le {formatDateTimeFR(order.payment.paidAt)}</p>
              ) : (
                <p className="mt-1 text-xs text-amber-700">En attente de confirmation du paiement.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
