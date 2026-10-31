import type { Metadata } from "next";
import Link from "next/link";
import { Info, MapPin } from "lucide-react";
import { formatFCFA, formatDateTimeFR } from "@/lib/utils";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getProducerByUserId } from "@/lib/services/producer.service";
import { advanceOrderAction } from "@/actions/producer";
import { DELIVERY_STATUS_LABELS, ORDER_STATUS_LABELS, type DeliveryStatus, type OrderStatus } from "@/lib/validations/enums";
import { ACTIONABLE_STATUSES, orderStatusTone } from "@/lib/order-ui";
import { PLACEHOLDER_IMAGE } from "@/lib/images";
import { Badge } from "@/components/ui/surfaces";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { SmartImage } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Commandes reçues" };

async function advanceOrderFormAction(formData: FormData) {
  "use server";
  await advanceOrderAction(formData);
}

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  PAID: { to: "CONFIRMED", label: "Confirmer" },
  CONFIRMED: { to: "PREPARING", label: "Préparer" },
  PREPARING: { to: "READY_FOR_DELIVERY", label: "Marquer prête" },
  READY_FOR_DELIVERY: { to: "IN_TRANSIT", label: "Expédier" },
};

const FILTERS = [
  { key: "tous", label: "Toutes", statuses: null },
  { key: "a-traiter", label: "À traiter", statuses: ACTIONABLE_STATUSES },
  { key: "en-cours", label: "En livraison", statuses: ["IN_TRANSIT"] as OrderStatus[] },
  { key: "terminees", label: "Terminées", statuses: ["DELIVERED", "CANCELLED", "REFUNDED"] as OrderStatus[] },
] as const;

export default async function ProducerOrdersPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const user = await requireRole("PRODUCER", "ADMIN", "SUPER_ADMIN");
  const producer = await getProducerByUserId(user.id);
  if (!producer) return null;

  const filter = FILTERS.find((f) => f.key === statut) ?? FILTERS[0];

  const orders = await prisma.order.findMany({
    where: {
      items: { some: { producerId: producer.id } },
      ...(filter.statuses ? { status: { in: [...filter.statuses] } } : {}),
    },
    include: {
      // Toutes les lignes sont lues pour détecter les commandes partagées ; seules les siennes sont affichées.
      items: true,
      delivery: { include: { zone: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <PageHeader
        title="Commandes reçues"
        description="Vous ne voyez que vos propres articles : les produits des autres producteurs restent invisibles."
      />

      <nav aria-label="Filtrer les commandes" className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "tous" ? "/vendeur/commandes" : `/vendeur/commandes?statut=${f.key}`}
            aria-current={f.key === filter.key ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              f.key === filter.key
                ? "border-brand-800 bg-brand-800 text-white"
                : "border-earth-300 bg-white text-earth-700 hover:border-brand-300 hover:bg-brand-50",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <EmptyState
          title={filter.key === "tous" ? "Aucune commande" : "Aucune commande dans cette vue"}
          description="Dès qu'un client achète un de vos produits, la commande apparaîtra ici."
        />
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => {
            const status = o.status as OrderStatus;
            const next = NEXT[status];
            const mine = o.items.filter((i) => i.producerId === producer.id);
            const shared = o.items.some((i) => i.producerId !== producer.id);
            const delivery = o.delivery;
            return (
              <li key={o.id} className="overflow-hidden rounded-2xl border border-earth-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-earth-100 bg-earth-50 px-5 py-3.5">
                  <div>
                    <p className="font-display text-lg font-extrabold tracking-tight text-brand-900">{o.number}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-earth-500">
                      {formatDateTimeFR(o.createdAt)}
                      {delivery ? (
                        <>
                          <span aria-hidden>·</span>
                          <MapPin className="h-3 w-3 text-forest-600" aria-hidden /> {delivery.zone.name}
                          <span aria-hidden>·</span> Livraison : {DELIVERY_STATUS_LABELS[delivery.status as DeliveryStatus] ?? delivery.status}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={orderStatusTone(status)}>{ORDER_STATUS_LABELS[status]}</Badge>
                    <span className="font-display text-lg font-extrabold text-brand-800">
                      {formatFCFA(mine.reduce((s, i) => s + i.total, 0))}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <ul className="divide-y divide-earth-100 text-sm">
                    {mine.map((item) => (
                      <li key={item.id} className="flex items-center gap-3 py-2.5">
                        <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-earth-100">
                          <SmartImage src={item.imageUrl || PLACEHOLDER_IMAGE} alt="" fill sizes="40px" className="object-cover" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-earth-800">
                          {item.productName} <span className="text-earth-500">× {item.quantity}</span>
                        </span>
                        <span className="shrink-0 font-semibold text-earth-900">{formatFCFA(item.total)}</span>
                      </li>
                    ))}
                  </ul>

                  {shared && next ? (
                    <p className="mt-3 flex items-start gap-2 rounded-xl bg-brand-50 px-3.5 py-3 text-xs text-brand-900">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      Commande partagée avec d&apos;autres producteurs : l&apos;équipe AFRIKA MARKET coordonne sa préparation et son
                      expédition.
                    </p>
                  ) : next ? (
                    <form action={advanceOrderFormAction} className="mt-4 flex flex-wrap items-center gap-3">
                      <input type="hidden" name="orderId" value={o.id} />
                      <input type="hidden" name="next" value={next.to} />
                      <button type="submit" className="btn-primary btn-md">
                        {next.label}
                      </button>
                      <span className="text-xs text-earth-500">Prochaine étape : {ORDER_STATUS_LABELS[next.to]}</span>
                    </form>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
