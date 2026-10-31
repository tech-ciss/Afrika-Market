import Link from "next/link";
import { ArrowRight, PackageCheck } from "lucide-react";
import { formatDateTimeFR, formatFCFA } from "@/lib/utils";
import { requireRole } from "@/lib/auth/guards";
import { getProducerByUserId, getProducerDashboard } from "@/lib/services/producer.service";
import { prisma } from "@/lib/db/prisma";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/validations/enums";
import { orderStatusTone } from "@/lib/order-ui";
import { Badge } from "@/components/ui/surfaces";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, StatStrip, Th } from "@/components/ui/stat";

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

  const pending = stats.pendingOrders.length;
  const bestSales = Math.max(1, ...stats.topProducts.map((p) => p.salesCount));

  return (
    <div className="space-y-8">
      <PageHeader title={`Bonjour, ${producer.name}`} description="Voici l'état de votre activité sur AFRIKA MARKET." />

      {/* Chiffre du mois (sombre) + action du jour (jaune) */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="on-dark overflow-hidden rounded-2xl bg-brand-900 text-white lg:col-span-2">
          <div className="p-6 sm:p-7">
            <p className="text-sm text-white/70">Chiffre d&apos;affaires de ce mois</p>
            <p className="mt-2 font-display text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
              {formatFCFA(stats.monthRevenue)}
            </p>
            <p className="mt-3 text-sm text-white/70">
              Depuis l&apos;ouverture : <span className="font-semibold text-sun-300">{formatFCFA(stats.revenue)}</span>
            </p>
          </div>
          <div className="weave" aria-hidden />
        </div>

        <Link
          href="/vendeur/commandes?statut=a-traiter"
          className={`group flex flex-col justify-between rounded-2xl p-6 sm:p-7 ${
            pending > 0 ? "bg-sun-400 text-brand-950 hover:bg-sun-300" : "border border-earth-200 bg-white text-earth-900"
          }`}
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <PackageCheck className="h-4 w-4" aria-hidden /> À préparer
          </span>
          <span>
            <span className="block font-display text-6xl font-extrabold leading-none">{pending}</span>
            <span className="mt-1 block text-sm">
              {pending === 0 ? "Aucune commande en attente" : pending === 1 ? "commande à traiter" : "commandes à traiter"}
            </span>
          </span>
          {pending > 0 ? (
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold">
              Ouvrir les commandes <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </span>
          ) : null}
        </Link>
      </section>

      <StatStrip
        items={[
          { label: "Commandes", value: String(stats.orderCount) },
          { label: "Unités vendues", value: String(stats.unitCount) },
          { label: "Produits en ligne", value: `${stats.activeProductCount} / ${stats.productCount}` },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-earth-200 bg-white p-5">
          <h2 className="font-display text-lg font-bold text-brand-950">Commandes à traiter</h2>
          {pending === 0 ? (
            <p className="mt-4 rounded-xl bg-earth-50 px-4 py-6 text-center text-sm text-earth-600">
              Rien à préparer pour le moment. Les nouvelles commandes apparaîtront ici.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-earth-100 text-sm">
              {stats.pendingOrders.map((o) => (
                <li key={o.orderId} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-earth-900">{o.order.number}</p>
                    <p className="text-xs text-earth-500">
                      {formatFCFA(o.order.total)} · {formatDateTimeFR(o.order.createdAt)}
                    </p>
                  </div>
                  <Link href="/vendeur/commandes?statut=a-traiter" className="btn-secondary btn-sm shrink-0">
                    Traiter
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-earth-200 bg-white p-5">
          <h2 className="font-display text-lg font-bold text-brand-950">Alertes de stock</h2>
          {stats.lowStock.length === 0 ? (
            <p className="mt-4 rounded-xl bg-forest-50 px-4 py-6 text-center text-sm text-forest-700">
              Tous vos produits sont au-dessus du seuil d&apos;alerte.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-earth-100 text-sm">
              {stats.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="truncate font-medium text-earth-900">{p.name}</span>
                  <Badge tone={p.stock === 0 ? "danger" : "warning"}>
                    {p.stock === 0 ? "Rupture" : `${p.stock} restant${p.stock > 1 ? "s" : ""}`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Link href="/vendeur/produits" className="mt-2 inline-flex items-center gap-1 py-2 text-sm font-semibold text-brand-700 hover:underline">
            Gérer mes stocks <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-brand-950">Meilleures ventes</h2>
        {stats.topProducts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-earth-300 bg-white px-4 py-8 text-center text-sm text-earth-600">
            Vos produits les plus vendus apparaîtront ici dès les premières commandes.
          </p>
        ) : (
          <ul className="divide-y divide-earth-100 rounded-2xl border border-earth-200 bg-white">
            {stats.topProducts.map((p) => (
              <li key={p.id} className="grid items-center gap-x-4 gap-y-1 px-5 py-4 sm:grid-cols-[1fr_180px_90px]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-earth-900">{p.name}</p>
                  <p className="text-xs text-earth-500">
                    {formatFCFA(p.price)} ·{" "}
                    <span className={p.stock === 0 ? "font-semibold text-kola-600" : ""}>
                      {p.stock === 0 ? "rupture" : `stock ${p.stock}`}
                    </span>
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-earth-100" aria-hidden>
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.max(4, Math.round((p.salesCount / bestSales) * 100))}%` }} />
                </div>
                <p className="text-sm font-bold text-brand-800 sm:text-right">{p.salesCount} vendus</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {recentOrders.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-brand-950">Dernières commandes</h2>
            <Link href="/vendeur/commandes" className="py-2 text-sm font-semibold text-brand-700 hover:underline">
              Tout voir
            </Link>
          </div>
          <DataTable>
            <thead>
              <tr>
                <Th>Commande</Th>
                <Th>Statut</Th>
                <Th align="right">Montant</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-100">
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-medium text-earth-900">{o.order.number}</td>
                  <td className="px-4 py-3">
                    <Badge tone={orderStatusTone(o.order.status)}>{ORDER_STATUS_LABELS[o.order.status as OrderStatus]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatFCFA(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </section>
      ) : null}
    </div>
  );
}
