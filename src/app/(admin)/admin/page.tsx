import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAdminDashboard, getDailyRevenueSeries } from "@/lib/services/stats.service";
import { formatFCFA } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, type OrderStatus, type PaymentMethod } from "@/lib/validations/enums";
import { PageHeader } from "@/components/ui/page-header";
import { StatStrip } from "@/components/ui/stat";
import { BarList } from "@/components/ui/bar-list";
import { Badge } from "@/components/ui/surfaces";

const STATUS_BAR: Partial<Record<string, string>> = {
  DELIVERED: "bg-forest-500",
  CANCELLED: "bg-kola-500",
  REFUNDED: "bg-kola-500",
  PENDING_PAYMENT: "bg-sun-500",
};

function Panel({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section className="rounded-2xl border border-earth-200 bg-white p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-brand-950">{title}</h2>
        {hint ? <span className="text-xs text-earth-500">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

export default async function AdminDashboardPage() {
  const [stats, series] = await Promise.all([getAdminDashboard(), getDailyRevenueSeries(14)]);
  const maxRevenue = Math.max(...series.map((s) => s.revenue), 1);

  // Ce qui attend une décision, par ordre d'urgence. Les compteurs à zéro restent visibles mais discrets.
  const todo = [
    { label: "Producteurs à valider", value: stats.alerts.pendingProducers, href: "/admin/producteurs" },
    { label: "Avis à modérer", value: stats.alerts.pendingReviews, href: "/admin/avis" },
    { label: "Paiements échoués", value: stats.alerts.failedPayments, href: "/admin/commandes" },
    { label: "Produits en stock faible", value: stats.alerts.lowStockCount, href: "/admin/produits" },
    { label: "Livraisons en cours", value: stats.alerts.activeDeliveries, href: "/admin/commandes?status=IN_TRANSIT", neutral: true },
  ];
  const urgent = todo.filter((t) => !t.neutral).reduce((n, t) => n + t.value, 0);

  return (
    <div className="space-y-8">
      <PageHeader title="Tableau de bord" description="L'activité de la plateforme et ce qui attend une décision de l'équipe." />

      <section className="grid gap-4 lg:grid-cols-3">
        {/* Chiffre d'affaires + courbe des 14 derniers jours */}
        <div className="on-dark overflow-hidden rounded-2xl bg-brand-900 text-white lg:col-span-2">
          <div className="p-6 sm:p-7">
            <p className="text-sm text-white/70">Chiffre d&apos;affaires sur 30 jours</p>
            <p className="mt-2 font-display text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
              {formatFCFA(stats.month.revenue)}
            </p>
            <p className="mt-2 text-sm text-white/70">
              {stats.month.orders} commande{stats.month.orders > 1 ? "s" : ""} · {formatFCFA(stats.week.revenue)} sur 7 jours
            </p>

            <div className="mt-7 flex h-36 items-end gap-1.5" role="img" aria-label="Chiffre d'affaires des 14 derniers jours">
              {series.map((day, i) => {
                const last = i === series.length - 1;
                return (
                  <div key={day.date} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                    <span className="text-[11px] font-semibold text-sun-300 opacity-0 transition-opacity group-hover:opacity-100">
                      {day.revenue > 0 ? `${Math.round(day.revenue / 1000)} k` : "0"}
                    </span>
                    <div
                      className={`w-full rounded-t-md transition-colors ${last ? "bg-sun-400" : "bg-white/25 group-hover:bg-white/60"}`}
                      style={{ height: `${Math.max(4, (day.revenue / maxRevenue) * 100)}px` }}
                      title={`${day.date} : ${formatFCFA(day.revenue)} (${day.orders} commande(s))`}
                    />
                    <span className="text-[11px] text-white/70">{day.date.slice(8)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="weave" aria-hidden />
        </div>

        {/* Centre d'action */}
        <div className={`rounded-2xl p-6 ${urgent > 0 ? "bg-sun-400 text-brand-950" : "border border-earth-200 bg-white"}`}>
          <p className="text-sm font-semibold">À traiter</p>
          <p className="mt-1 font-display text-6xl font-extrabold leading-none">{urgent}</p>
          <ul className="mt-5 space-y-1">
            {todo.map((t) => (
              <li key={t.label}>
                <Link
                  href={t.href}
                  className={`group flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                    urgent > 0 ? "hover:bg-brand-950/10" : "hover:bg-earth-50"
                  } ${t.value === 0 ? "opacity-60" : "font-semibold"}`}
                >
                  <span>{t.label}</span>
                  <span className="flex items-center gap-1 tabular-nums">
                    {t.value}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <StatStrip
        items={[
          { label: "Aujourd'hui", value: formatFCFA(stats.today.revenue), hint: `${stats.today.orders} commande(s)` },
          { label: "Panier moyen", value: formatFCFA(stats.all.averageBasket), hint: `${stats.all.orders} commandes cumulées` },
          { label: "Clients", value: String(stats.customers.total), hint: `+${stats.customers.newThisMonth} ce mois` },
          { label: "Taux d'annulation", value: `${stats.cancelledRate} %`, hint: "sur toutes les commandes" },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Statuts des commandes">
          <BarList
            items={stats.statusBreakdown
              .slice()
              .sort((a, b) => b.count - a.count)
              .map((s) => ({
                label: ORDER_STATUS_LABELS[s.status as OrderStatus] ?? s.status,
                value: s.count,
                barClass: STATUS_BAR[s.status],
              }))}
          />
        </Panel>

        <Panel title="Moyens de paiement">
          <BarList
            items={stats.paymentMethods.map((p) => ({
              label: PAYMENT_METHOD_LABELS[p.method as PaymentMethod] ?? p.method,
              value: p.count,
            }))}
          />
        </Panel>

        <Panel title="Produits les plus vendus">
          <BarList
            ranked
            format={formatFCFA}
            items={stats.topProducts.map((p) => ({ label: p.product?.name ?? "—", value: p.revenue, hint: `${p.quantity} u.` }))}
          />
        </Panel>

        <Panel title="Producteurs les plus performants">
          <BarList
            ranked
            format={formatFCFA}
            items={stats.topProducers.map((p) => ({ label: p.producer?.name ?? "—", value: p.revenue, hint: `${p.units} u.` }))}
          />
        </Panel>

        <Panel title="Zones de livraison les plus actives">
          <BarList items={stats.topZones.map((z) => ({ label: z.zone, value: z.count, hint: "commandes" }))} />
        </Panel>

        <Panel title="Stocks faibles" hint={`${stats.alerts.lowStockCount} produit(s)`}>
          {stats.lowStockProducts.length === 0 ? (
            <p className="rounded-xl bg-forest-50 px-4 py-6 text-center text-sm text-forest-700">Aucun stock faible.</p>
          ) : (
            <ul className="divide-y divide-earth-100 text-sm">
              {stats.lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="truncate font-medium text-earth-900">{p.name}</span>
                  <Badge tone={p.stock === 0 ? "danger" : "warning"}>{p.stock === 0 ? "Rupture" : `${p.stock} restant(s)`}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
