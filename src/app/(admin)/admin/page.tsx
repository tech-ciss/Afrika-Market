import Link from "next/link";
import { AlertTriangle, Star, Truck, Users } from "lucide-react";
import { getAdminDashboard, getDailyRevenueSeries } from "@/lib/services/stats.service";
import { formatFCFA } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/validations/enums";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/surfaces";

export default async function AdminDashboardPage() {
  const [stats, series] = await Promise.all([getAdminDashboard(), getDailyRevenueSeries(14)]);
  const maxRevenue = Math.max(...series.map((s) => s.revenue), 1);

  const kpis = [
    { label: "CA du jour", value: formatFCFA(stats.today.revenue), sub: `${stats.today.orders} commande(s)` },
    { label: "CA 7 jours", value: formatFCFA(stats.week.revenue), sub: `${stats.week.orders} commande(s)` },
    { label: "CA 30 jours", value: formatFCFA(stats.month.revenue), sub: `${stats.month.orders} commande(s)` },
    { label: "Panier moyen", value: formatFCFA(stats.all.averageBasket), sub: `${stats.all.orders} commandes cumulées` },
    { label: "Clients", value: String(stats.customers.total), sub: `+${stats.customers.newThisMonth} ce mois` },
    { label: "Taux d'annulation", value: `${stats.cancelledRate} %`, sub: "sur toutes commandes" },
  ];

  const alerts = [
    { label: "Avis en attente", value: stats.alerts.pendingReviews, href: "/admin/avis", icon: Star },
    { label: "Paiements échoués", value: stats.alerts.failedPayments, href: "/admin/commandes", icon: AlertTriangle },
    { label: "Livraisons en cours", value: stats.alerts.activeDeliveries, href: "/admin/commandes", icon: Truck },
    { label: "Producteurs à valider", value: stats.alerts.pendingProducers, href: "/admin/producteurs", icon: Users },
    { label: "Stock faible", value: stats.alerts.lowStockCount, href: "/admin/produits", icon: AlertTriangle },
    { label: "Abonnés newsletter", value: stats.alerts.newsletterCount, href: "/admin/newsletter", icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* KPI */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent>
              <p className="text-xs uppercase tracking-wide text-earth-500">{k.label}</p>
              <p className="mt-1 text-xl font-bold text-earth-900">{k.value}</p>
              <p className="mt-0.5 text-[11px] text-earth-500">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Alertes */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {alerts.map((a) => (
          <Link key={a.label} href={a.href} className="rounded-xl border border-earth-200 bg-white p-4 hover:border-brand-300 hover:shadow-card">
            <p className="flex items-center gap-1.5 text-xs font-medium text-earth-500">
              <a.icon className="h-3.5 w-3.5 text-brand-600" aria-hidden /> {a.label}
            </p>
            <p className={`mt-1 text-2xl font-bold ${a.value > 0 ? "text-earth-900" : "text-forest-600"}`}>{a.value}</p>
          </Link>
        ))}
      </section>

      {/* Graphique CA */}
      <section>
        <h2 className="text-lg font-bold text-earth-900">Chiffre d&apos;affaires — 14 derniers jours</h2>
        <Card className="mt-3">
          <CardContent>
            <div className="flex h-52 items-end gap-1.5 overflow-x-auto">
              {series.map((day) => (
                <div key={day.date} className="group flex min-w-10 flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-earth-500 opacity-0 group-hover:opacity-100">
                    {day.revenue > 0 ? `${Math.round(day.revenue / 1000)}k` : "0"}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 transition group-hover:from-brand-700"
                    style={{ height: `${Math.max(4, (day.revenue / maxRevenue) * 160)}px` }}
                    title={`${day.date} : ${formatFCFA(day.revenue)} (${day.orders} commande(s))`}
                  />
                  <span className="text-[10px] text-earth-400">{day.date.slice(8)}/{day.date.slice(5, 7)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Statuts & top */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Statuts des commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {stats.statusBreakdown
                .slice()
                .sort((a, b) => b.count - a.count)
                .map((s) => (
                  <li key={s.status} className="flex items-center justify-between">
                    <span className="text-earth-600">
                      {ORDER_STATUS_LABELS[s.status as keyof typeof ORDER_STATUS_LABELS] ?? s.status}
                    </span>
                    <Badge tone={s.status === "CANCELLED" ? "danger" : s.status === "DELIVERED" ? "success" : "neutral"}>
                      {s.count}
                    </Badge>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moyens de paiement utilisés</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {stats.paymentMethods.map((p) => (
                <li key={p.method} className="flex items-center justify-between">
                  <span className="text-earth-600">{PAYMENT_METHOD_LABELS[p.method as PaymentMethod] ?? p.method}</span>
                  <Badge tone="neutral">{p.count}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produits les plus vendus</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-earth-100 text-sm">
              {stats.topProducts.map((p) => (
                <li key={p.product?.id} className="flex items-center justify-between py-2">
                  <span className="truncate font-medium text-earth-900">{p.product?.name}</span>
                  <span className="shrink-0 text-earth-600">
                    {p.quantity} u. · {formatFCFA(p.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Producteurs les plus performants</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-earth-100 text-sm">
              {stats.topProducers.map((p) => (
                <li key={p.producer?.id} className="flex items-center justify-between py-2">
                  <span className="truncate font-medium text-earth-900">{p.producer?.name}</span>
                  <span className="shrink-0 text-earth-600">
                    {p.units} u. · {formatFCFA(p.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Zones de livraison les plus actives</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {stats.topZones.map((z) => (
                <li key={z.zone} className="flex items-center justify-between">
                  <span className="text-earth-600">{z.zone}</span>
                  <Badge tone="neutral">{z.count}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stocks faibles à traiter</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-earth-100 text-sm">
              {stats.lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <span className="truncate font-medium text-earth-900">{p.name}</span>
                  <span className={`shrink-0 text-xs font-bold ${p.stock === 0 ? "text-red-600" : "text-amber-700"}`}>
                    {p.stock === 0 ? "Rupture" : `${p.stock} restant(s)`}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
