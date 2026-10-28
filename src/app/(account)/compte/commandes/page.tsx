import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getOrdersForUser } from "@/lib/services/order.service";
import { formatFCFA, formatDateTimeFR, parseJsonObject } from "@/lib/utils";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/validations/enums";
import { Badge } from "@/components/ui/surfaces";
import { EmptyState } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Mes commandes" };

const TONES: Record<string, "neutral" | "success" | "warning" | "danger" | "brand" | "info"> = {
  PENDING_PAYMENT: "warning",
  PAID: "info",
  CONFIRMED: "info",
  PREPARING: "brand",
  READY_FOR_DELIVERY: "brand",
  IN_TRANSIT: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
  REFUNDED: "neutral",
};

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await getOrdersForUser(user.id);

  return (
    <div>
      <h1 className="text-2xl font-bold text-earth-900">Mes commandes</h1>
      <p className="mt-1 text-sm text-earth-600">Suivez vos commandes et retrouvez vos factures.</p>

      <div className="mt-6 space-y-3">
        {orders.length === 0 ? (
          <EmptyState
            icon={<Package className="h-10 w-10" />}
            title="Aucune commande pour l'instant"
            description="Découvrez nos produits locaux et passez votre première commande."
            action={
              <Link href="/produits" className="btn-primary btn-md">
                Découvrir la boutique
              </Link>
            }
          />
        ) : (
          orders.map((order) => {
            const address = parseJsonObject<Record<string, string>>(order.shippingAddress, {});
            const status = order.status as OrderStatus;
            return (
              <Link
                key={order.id}
                href={`/compte/commandes/${order.number}`}
                className="block rounded-2xl border border-earth-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-earth-900">{order.number}</p>
                    <p className="mt-0.5 text-xs text-earth-500">
                      {formatDateTimeFR(order.createdAt)} · {order.items.length} article(s) · {address.city ?? ""}{" "}
                      {address.district ? `· ${address.district}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={TONES[status] ?? "neutral"}>{ORDER_STATUS_LABELS[status]}</Badge>
                    <span className="text-base font-bold text-brand-700">{formatFCFA(order.total)}</span>
                  </div>
                </div>

                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {order.items.slice(0, 5).map((item) => (
                    <span key={item.id} className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-earth-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl || "/images/products/placeholder.svg"} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </span>
                  ))}
                  {order.items.length > 5 ? (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-earth-100 text-xs font-semibold text-earth-600">
                      +{order.items.length - 5}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
