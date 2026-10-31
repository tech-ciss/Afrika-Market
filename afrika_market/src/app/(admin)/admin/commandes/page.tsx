import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, Search } from "lucide-react";
import { formatFCFA, formatDateTimeFR, cn } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { adminCancelOrderAction, adminRefundOrderAction, adminTransitionOrderAction } from "@/actions/admin";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/validations/enums";
import { orderStatusTone } from "@/lib/order-ui";
import { Badge } from "@/components/ui/surfaces";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { EmptyState, Pagination } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Commandes" };

async function transitionFormAction(formData: FormData) {
  "use server";
  await adminTransitionOrderAction(formData);
}
async function cancelFormAction(formData: FormData) {
  "use server";
  await adminCancelOrderAction(formData);
}
async function refundFormAction(formData: FormData) {
  "use server";
  await adminRefundOrderAction(formData);
}

const NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING_PAYMENT: ["CONFIRMED", "CANCELLED"],
  PAID: ["CONFIRMED", "PREPARING", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_DELIVERY", "IN_TRANSIT"],
  READY_FOR_DELIVERY: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

/** Libellé de l'ACTION (verbe), à ne pas confondre avec le libellé du STATUT (adjectif). */
const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: "Confirmer",
  PREPARING: "Lancer la préparation",
  READY_FOR_DELIVERY: "Marquer prête",
  IN_TRANSIT: "Expédier",
  DELIVERED: "Marquer livrée",
};

const PAYMENT_TONE: Record<string, string> = {
  PAID: "text-forest-700",
  FAILED: "text-kola-600",
  CANCELLED: "text-kola-600",
  REFUNDED: "text-earth-600",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}) {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const perPage = 20;

  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { number: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, orders, counts] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        items: { select: { id: true, productName: true, quantity: true, producerName: true } },
        payment: { select: { provider: true, status: true } },
        delivery: { include: { zone: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const all = counts.reduce((n, c) => n + c._count, 0);

  const chipHref = (s?: string) => {
    const params = new URLSearchParams();
    if (s) params.set("status", s);
    if (q) params.set("q", q);
    const qs = params.toString();
    return `/admin/commandes${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <PageHeader title="Commandes" description={`${total} commande${total > 1 ? "s" : ""}${status || q ? " dans cette vue" : ""}.`} />

      <form action="/admin/commandes" className="mb-4 flex gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-500" aria-hidden />
          <label htmlFor="q" className="sr-only">
            Rechercher une commande
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Numéro ou e-mail du client"
            className="w-full rounded-full border border-earth-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-earth-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <button type="submit" className="btn-secondary btn-md">
          Rechercher
        </button>
      </form>

      <nav aria-label="Filtrer par statut" className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {[{ key: undefined as OrderStatus | undefined, label: "Toutes", count: all }, ...ORDER_STATUSES.map((s) => ({ key: s as OrderStatus | undefined, label: ORDER_STATUS_LABELS[s], count: countOf(s) }))].map(
          (f) => (
            <Link
              key={f.key ?? "all"}
              href={chipHref(f.key)}
              aria-current={status === f.key ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                status === f.key
                  ? "border-brand-800 bg-brand-800 text-white"
                  : "border-earth-300 bg-white text-earth-700 hover:border-brand-300 hover:bg-brand-50",
              )}
            >
              {f.label}
              <span className={cn("text-xs tabular-nums", status === f.key ? "text-sun-300" : "text-earth-500")}>{f.count}</span>
            </Link>
          ),
        )}
      </nav>

      {orders.length === 0 ? (
        <EmptyState title="Aucune commande" description="Aucune commande ne correspond à ces critères." />
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => {
            const oStatus = o.status as OrderStatus;
            const nextOptions = (NEXT[oStatus] ?? []).filter((n) => n !== "CANCELLED" && n !== "REFUNDED");
            const [primary, ...others] = nextOptions;
            const canCancel = oStatus !== "CANCELLED" && oStatus !== "DELIVERED" && oStatus !== "REFUNDED";
            const canRefund = oStatus === "DELIVERED" || (o.isPaid && oStatus === "CANCELLED");
            return (
              <li key={o.id} className="overflow-hidden rounded-2xl border border-earth-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-earth-100 bg-earth-50 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="font-display text-lg font-extrabold tracking-tight text-brand-900">{o.number}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-earth-500">
                      {formatDateTimeFR(o.createdAt)} <span aria-hidden>·</span> {o.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={orderStatusTone(oStatus)}>{ORDER_STATUS_LABELS[oStatus]}</Badge>
                    <span className="font-display text-lg font-extrabold text-brand-800">{formatFCFA(o.total)}</span>
                  </div>
                </div>

                <div className="space-y-3 p-5">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-earth-600">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-forest-600" aria-hidden /> {o.delivery?.zone.name ?? "—"}
                    </span>
                    <span aria-hidden>·</span>
                    <span>
                      {PAYMENT_METHOD_LABELS[o.paymentMethod as PaymentMethod] ?? o.payment?.provider ?? "—"} :{" "}
                      <span className={cn("font-semibold", PAYMENT_TONE[o.payment?.status ?? ""] ?? "text-earth-700")}>
                        {PAYMENT_STATUS_LABELS[o.payment?.status as PaymentStatus] ?? "—"}
                      </span>
                    </span>
                  </p>

                  <ul className="flex flex-wrap gap-2 text-xs text-earth-700">
                    {o.items.map((i) => (
                      <li key={i.id} className="rounded-full bg-earth-100 px-3 py-1">
                        {i.productName} × {i.quantity} <span className="text-earth-500">({i.producerName})</span>
                      </li>
                    ))}
                  </ul>

                  {primary || canCancel || canRefund ? (
                    <div className="flex flex-wrap items-center gap-2 border-t border-earth-100 pt-3">
                      {primary ? (
                        <form action={transitionFormAction}>
                          <input type="hidden" name="orderId" value={o.id} />
                          <input type="hidden" name="next" value={primary} />
                          <button type="submit" className="btn-primary btn-sm">
                            {ACTION_LABELS[primary] ?? ORDER_STATUS_LABELS[primary]} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </form>
                      ) : null}
                      {others.map((n) => (
                        <form key={n} action={transitionFormAction}>
                          <input type="hidden" name="orderId" value={o.id} />
                          <input type="hidden" name="next" value={n} />
                          <button type="submit" className="btn-secondary btn-sm">
                            {ACTION_LABELS[n] ?? ORDER_STATUS_LABELS[n]}
                          </button>
                        </form>
                      ))}

                      <span className="flex-1" />

                      {canCancel ? (
                        <form action={cancelFormAction}>
                          <input type="hidden" name="number" value={o.number} />
                          <ConfirmButton
                            message={`Annuler la commande ${o.number} ? Le stock sera remis en vente${o.isPaid ? " et le client remboursé" : ""}.`}
                            className="btn-ghost btn-sm text-kola-600 hover:bg-kola-50"
                          >
                            Annuler
                          </ConfirmButton>
                        </form>
                      ) : null}

                      {canRefund ? (
                        <form action={refundFormAction}>
                          <input type="hidden" name="number" value={o.number} />
                          <ConfirmButton message={`Rembourser la commande ${o.number} (${formatFCFA(o.total)}) ?`} className="btn-ghost btn-sm">
                            Rembourser
                          </ConfirmButton>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        page={page}
        pageCount={Math.max(1, Math.ceil(total / perPage))}
        basePath="/admin/commandes"
        searchParams={{ status, q: q || undefined }}
      />
    </div>
  );
}
