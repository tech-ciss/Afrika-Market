import type { Metadata } from "next";
import { formatFCFA, formatDateTimeFR } from "@/lib/utils";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getProducerByUserId } from "@/lib/services/producer.service";
import { advanceOrderAction } from "@/actions/producer";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/validations/enums";
import { Badge, Card, CardContent } from "@/components/ui/surfaces";
import { EmptyState } from "@/components/ui/feedback";

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

export default async function ProducerOrdersPage() {
  const user = await requireRole("PRODUCER", "ADMIN", "SUPER_ADMIN");
  const producer = await getProducerByUserId(user.id);
  if (!producer) return null;

  const orders = await prisma.order.findMany({
    where: { items: { some: { producerId: producer.id } } },
    include: {
      items: { where: { producerId: producer.id } },
      delivery: { include: { zone: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h2 className="text-lg font-bold text-earth-900">Commandes contenant mes produits</h2>
      <p className="mt-1 text-sm text-earth-600">
        Vous ne voyez que les articles qui vous appartiennent : les commandes des autres producteurs restent
        invisibles (cloisonnement des données).
      </p>

      <div className="mt-5 space-y-4">
        {orders.length === 0 ? (
          <EmptyState
            title="Aucune commande"
            description="Dès qu'un client achète un de vos produits, la commande apparaîtra ici."
          />
        ) : (
          orders.map((o) => {
            const status = o.status as OrderStatus;
            const next = NEXT[status];
            return (
              <Card key={o.id}>
                <CardContent>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-earth-900">{o.number}</p>
                      <p className="text-xs text-earth-500">
                        {formatDateTimeFR(o.createdAt)} · {o.delivery?.zone.name ?? "—"} ·{" "}
                        {o.delivery ? ORDER_STATUS_LABELS[o.delivery.status as never] ?? o.delivery.status : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={status === "DELIVERED" ? "success" : status === "CANCELLED" ? "danger" : "brand"}>
                        {ORDER_STATUS_LABELS[status]}
                      </Badge>
                      <span className="font-bold text-brand-700">{formatFCFA(o.items.reduce((s, i) => s + i.total, 0))}</span>
                    </div>
                  </div>

                  <ul className="mt-3 divide-y divide-earth-100 text-sm">
                    {o.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between py-2">
                        <span className="text-earth-800">
                          {item.productName} <span className="text-earth-500">× {item.quantity}</span>
                        </span>
                        <span className="font-medium text-earth-900">{formatFCFA(item.total)}</span>
                      </li>
                    ))}
                  </ul>

                  {next ? (
                    <form action={advanceOrderFormAction} className="mt-3 flex items-center gap-3">
                      <input type="hidden" name="orderId" value={o.id} />
                      <input type="hidden" name="next" value={next.to} />
                      <button type="submit" className="btn-dark btn-md">
                        {next.label}
                      </button>
                      <span className="text-xs text-earth-500">Prochaine étape : {ORDER_STATUS_LABELS[next.to]}</span>
                    </form>
                  ) : status === "DELIVERED" ? (
                    <p className="mt-3 text-xs font-semibold text-forest-700">Commande livrée ✓</p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
