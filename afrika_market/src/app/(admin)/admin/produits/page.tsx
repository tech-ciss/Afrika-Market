import type { Metadata } from "next";
import Link from "next/link";
import { formatFCFA, cn } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { getStockAlerts } from "@/lib/services/stock.service";
import { adminToggleProductAction } from "@/actions/admin";
import { coverImage } from "@/lib/images";
import { Badge } from "@/components/ui/surfaces";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Pagination } from "@/components/ui/feedback";
import { FilterChips, SearchBox } from "@/components/ui/filter-chips";
import { PageHeader } from "@/components/ui/page-header";
import { SmartImage } from "@/components/ui/smart-image";
import { DataTable, Th } from "@/components/ui/stat";

export const metadata: Metadata = { title: "Produits" };

async function toggleProductFormAction(formData: FormData) {
  "use server";
  await adminToggleProductAction(formData);
}

const VIEWS = [
  { key: "tous", label: "Tous" },
  { key: "en-ligne", label: "En ligne" },
  { key: "masques", label: "Masqués" },
  { key: "stock-bas", label: "Stock bas" },
  { key: "rupture", label: "Rupture" },
] as const;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; q?: string; page?: string }>;
}) {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const sp = await searchParams;
  const view = VIEWS.find((v) => v.key === sp.vue)?.key ?? "tous";
  const q = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const perPage = 25;

  const alerts = await getStockAlerts();
  const lowIds = alerts.filter((a) => a.stock > 0).map((a) => a.id);

  const where = {
    ...(view === "en-ligne" ? { isActive: true } : {}),
    ...(view === "masques" ? { isActive: false } : {}),
    ...(view === "rupture" ? { stock: 0 } : {}),
    ...(view === "stock-bas" ? { id: { in: lowIds } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { producer: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [total, products, all, online, out] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { producer: { select: { name: true } }, category: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { stock: 0 } }),
  ]);
  const counts: Record<string, number> = {
    tous: all,
    "en-ligne": online,
    masques: all - online,
    "stock-bas": lowIds.length,
    rupture: out,
  };
  const href = (v: string) => {
    const p = new URLSearchParams();
    if (v !== "tous") p.set("vue", v);
    if (q) p.set("q", q);
    return `/admin/produits${p.toString() ? `?${p}` : ""}`;
  };

  return (
    <div>
      <PageHeader title="Produits" description={`${total} produit${total > 1 ? "s" : ""} dans cette vue. Masquer un produit le retire de la boutique sans le supprimer.`} />
      <SearchBox action="/admin/produits" defaultValue={q} placeholder="Nom du produit ou du producteur" hidden={{ vue: view === "tous" ? undefined : view }} />
      <FilterChips
        label="Filtrer les produits"
        items={VIEWS.map((v) => ({ key: v.key, label: v.label, href: href(v.key), count: counts[v.key], active: view === v.key }))}
      />

      {products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-earth-300 bg-white px-4 py-10 text-center text-sm text-earth-600">
          Aucun produit ne correspond à ces critères.
        </p>
      ) : (
        <DataTable className="min-w-0">
          <thead>
            <tr>
              <Th>Produit</Th>
              <Th>Producteur</Th>
              <Th align="right">Prix</Th>
              <Th align="right">Stock</Th>
              <Th align="right">Ventes</Th>
              <Th align="right">Statut</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-earth-100">
            {products.map((p) => (
              <tr key={p.id} className="align-middle hover:bg-earth-50/60">
                <td className="px-4 py-3">
                  <Link href={`/produits/${p.slug}`} className="flex items-center gap-3 font-medium text-earth-900 hover:text-brand-700">
                    <span className="relative h-11 w-10 shrink-0 overflow-hidden rounded-lg bg-earth-100">
                      <SmartImage src={coverImage(p.images)} alt="" fill sizes="40px" className={cn("object-cover", !p.isActive && "grayscale")} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate">{p.name}</span>
                      <span className="block truncate text-xs font-normal text-earth-500">{p.category.name}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-earth-600">{p.producer.name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-brand-800">{formatFCFA(p.price)}</td>
                <td
                  className={cn(
                    "px-4 py-3 text-right font-semibold tabular-nums",
                    p.stock === 0 ? "text-kola-600" : p.stock <= p.lowStockThreshold ? "text-sun-700" : "text-earth-800",
                  )}
                >
                  {p.stock}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-earth-600">{p.salesCount}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {p.isActive ? <Badge tone="success">En ligne</Badge> : <Badge tone="neutral">Masqué</Badge>}
                    <form action={toggleProductFormAction}>
                      <input type="hidden" name="id" value={p.id} />
                      {p.isActive ? (
                        <ConfirmButton message={`Masquer « ${p.name} » de la boutique ?`} className="btn-ghost btn-sm">
                          Masquer
                        </ConfirmButton>
                      ) : (
                        <button type="submit" className="btn-secondary btn-sm">
                          Republier
                        </button>
                      )}
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}

      <Pagination
        page={page}
        pageCount={Math.max(1, Math.ceil(total / perPage))}
        basePath="/admin/produits"
        searchParams={{ vue: view === "tous" ? undefined : view, q: q || undefined }}
      />
    </div>
  );
}
