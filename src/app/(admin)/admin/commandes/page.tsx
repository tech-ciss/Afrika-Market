import type { Metadata } from "next";
import Link from "next/link";
import { formatFCFA, formatDateTimeFR } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { adminCancelOrderAction, adminRefundOrderAction, adminTransitionOrderAction } from "@/actions/admin";
import { ORDER_STATUS_LABELS, ORDER_STATUSES, type OrderStatus } from "@/lib/validations/enums";
import { Badge, Card, CardContent } from "@/components/ui/surfaces";
import { Pagination } from "@/components/ui/feedback";

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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const perPage = 20;

  const where = status ? { status } : {};
  const [total, orders] = await Promise.all([
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
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-earth-900">Commandes ({total})</h2>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href="/admin/commandes"
            className={`btn-sm rounded-lg px-3 py-1.5 text-xs font-semibold ${!status ? "bg-brand-600 text-white" : "border border-earth-300 bg-white text-earth-700"}`}
          >
            Toutes
          </Link>
          {ORDER_STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin/commandes?status=${s}`}
              className={`btn-sm rounded-lg px-3 py-1.5 text-xs font-semibold ${status === s ? "bg-brand-600 text-white" : "border border-earth-300 bg-white text-earth-700"}`}
            >
              {ORDER_STATUS_LABELS[s]}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {orders.map((o) => {
          const oStatus = o.status as OrderStatus;
          const nextOptions = (NEXT[oStatus] ?? []).filter((n) => n !== "CANCELLED" && n !== "REFUNDED");
          return (
            <Card key={o.id}>
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-earth-900">{o.number}</p>
                    <p className="text-xs text-earth-500">
                      {formatDateTimeFR(o.createdAt)} · {o.email} · {o.delivery?.zone.name ?? "—"} ·{" "}
                      {o.payment?.provider ?? "—"} ({o.payment?.status ?? "—"})
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={oStatus === "DELIVERED" ? "success" : oStatus === "CANCELLED" ? "danger" : "brand"}>
                      {ORDER_STATUS_LABELS[oStatus]}
                    </Badge>
                    <span className="font-bold text-brand-700">{formatFCFA(o.total)}</span>
                  </div>
                </div>

                <ul className="mt-3 flex flex-wrap gap-2 text-xs text-earth-600">
                  {o.items.map((i) => (
                    <li key={i.id} className="rounded-lg bg-earth-50 px-2 py-1">
                      {i.productName} × {i.quantity} <span className="text-earth-400">({i.producerName})</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {nextOptions.map((n) => (
                    <form key={n} action={transitionFormAction}>
                      <input type="hidden" name="orderId" value={o.id} />
                      <input type="hidden" name="next" value={n} />
                      <button type="submit" className="btn-secondary btn-sm">
                        → {ORDER_STATUS_LABELS[n]}
                      </button>
                    </form>
                  ))}

                  {oStatus !== "CANCELLED" && oStatus !== "DELIVERED" && oStatus !== "REFUNDED" ? (
                    <form action={cancelFormAction}>
                      <input type="hidden" name="number" value={o.number} />
                      <button type="submit" className="btn-ghost btn-sm text-red-600 hover:bg-red-50">
                        Annuler
                      </button>
                    </form>
                  ) : null}

                  {oStatus === "DELIVERED" || (o.isPaid && oStatus === "CANCELLED") ? (
                    <form action={refundFormAction}>
                      <input type="hidden" name="number" value={o.number} />
                      <button type="submit" className="btn-ghost btn-sm">
                        Rembourser
                      </button>
                    </form>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / perPage))} basePath="/admin/commandes" searchParams={status ? { status } : {}} />
    </div>
  );
}
