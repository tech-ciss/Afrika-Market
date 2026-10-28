import Link from "next/link";
import { formatFCFA } from "@/lib/utils";
import { requireRole } from "@/lib/auth/guards";
import { getProducerByUserId, getProducerDashboard } from "@/lib/services/producer.service";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/surfaces";
import { EmptyState } from "@/components/ui/feedback";

export default async function ProducerDashboardPage() {
  const user = await requireRole("PRODUCER", "ADMIN", "SUPER_ADMIN");
  const producer = await getProducerByUserId(user.id);
  if (!producer) return null;

  const [stats, recentOrders] = await Promise.all([
    getProducerDashboard(producer.id),
    prisma.orderItem.findMany({
      where: { producerId: producer.id },
      select: {
        id: true,
        productName: true,
        quantity: true,
        total: true,
        order: { select: { number: true, status: true, createdAt: true, items: { select: { quantity: true } } } },
      },
      distinct: ["orderId"],
      orderBy: { order: { createdAt: "desc" } },
      take: 6,
    }),
  ]);

  const kpis = [
    { label: "Chiffre d'affaires total", value: formatFCFA(stats.revenue) },
    { label: "Ce mois-ci", value: formatFCFA(stats.monthRevenue) },
    { label: "Commandes", value: String(stats.orderCount) },
    { label: "Produits actifs", value: `${stats.activeProductCount} / ${stats.productCount}` },
    { label: "Unités vendues", value: String(stats.unitCount) },
    { label: "À préparer", value: String(stats.pendingOrders.length) },
  ];

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-bold text-earth-900">Vue d&apos;ensemble</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardContent>
                <p className="text-xs uppercase tracking-wide text-earth-500">{k.label}</p>
                <p className="mt-1 text-2xl font-bold text-earth-900">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commandes à traiter</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.pendingOrders.length === 0 ? (
              <EmptyState title="Aucune commande à traiter" description="Les nouvelles commandes apparaîtront ici." />
            ) : (
              <ul className="divide-y divide-earth-100 text-sm">
                {stats.pendingOrders.map((o) => (
                  <li key={o.orderId} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="font-semibold text-earth-900">{o.order.number}</p>
                      <p className="text-xs text-earth-500">{o.order.total} FCFA · {o.order.createdAt.toLocaleDateString("fr-FR")}</p>
                    </div>
                    <Link href="/vendeur/commandes" className="text-xs font-semibold text-brand-700 underline">
                      Traiter
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertes stock</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStock.length === 0 ? (
              <EmptyState title="Aucune alerte stock" description="Tous vos produits sont au-dessus du seuil." />
            ) : (
              <ul className="divide-y divide-earth-100 text-sm">
                {stats.lowStock.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2.5">
                    <span className="truncate font-medium text-earth-900">{p.name}</span>
                    <span className={`shrink-0 text-xs font-bold ${p.stock === 0 ? "text-red-600" : "text-amber-700"}`}>
                      {p.stock === 0 ? "Rupture" : `${p.stock} restant(s)`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-bold text-earth-900">Meilleures ventes</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-earth-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-earth-50 text-left text-xs uppercase tracking-wide text-earth-500">
              <tr>
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3 text-right">Prix</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Vendus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-100">
              {stats.topProducts.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-earth-900">{p.name}</td>
                  <td className="px-4 py-3 text-right">{formatFCFA(p.price)}</td>
                  <td className={`px-4 py-3 text-right ${p.stock === 0 ? "font-bold text-red-600" : ""}`}>{p.stock}</td>
                  <td className="px-4 py-3 text-right font-semibold">{p.salesCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {recentOrders.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold text-earth-900">Dernières commandes</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-earth-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-earth-50 text-left text-xs uppercase tracking-wide text-earth-500">
                <tr>
                  <th className="px-4 py-3">Commande</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-100">
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-medium text-earth-900">{o.order.number}</td>
                    <td className="px-4 py-3 text-earth-600">{o.order.status}</td>
                    <td className="px-4 py-3 text-right">{formatFCFA(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
