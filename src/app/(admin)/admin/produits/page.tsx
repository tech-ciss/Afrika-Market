import type { Metadata } from "next";
import Link from "next/link";
import { formatFCFA } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { getStockAlerts } from "@/lib/services/stock.service";
import { Badge } from "@/components/ui/surfaces";

export const metadata: Metadata = { title: "Produits" };

export default async function AdminProductsPage() {
  await requireRole("ADMIN", "SUPER_ADMIN");

  const [products, alerts] = await Promise.all([
    prisma.product.findMany({
      include: {
        producer: { select: { name: true } },
        category: { select: { name: true } },
        country: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getStockAlerts(),
  ]);
  const alertIds = new Set(alerts.map((a) => a.id));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-earth-900">Produits ({products.length})</h2>
        <p className="text-sm text-earth-600">{alertIds.size} alerte(s) de stock</p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-earth-200 bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-earth-50 text-left text-xs uppercase tracking-wide text-earth-500">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Producteur</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3 text-right">Prix</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Ventes</th>
              <th className="px-4 py-3 text-right">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-earth-100">
            {products.map((p) => {
              const images = JSON.parse(p.images || "[]") as string[];
              return (
                <tr key={p.id} className="hover:bg-earth-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/produits/${p.slug}`} className="flex items-center gap-3 font-medium text-earth-900 hover:text-brand-700">
                      <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-earth-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={images[0] ?? "/images/products/placeholder.svg"} alt="" className="h-full w-full object-cover" loading="lazy" />
                      </span>
                      <span className="truncate">{p.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-earth-600">{p.producer.name}</td>
                  <td className="px-4 py-3 text-earth-600">{p.category.name}</td>
                  <td className="px-4 py-3 text-right">{formatFCFA(p.price)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${p.stock === 0 ? "text-red-600" : alertIds.has(p.id) ? "text-amber-700" : ""}`}>
                    {p.stock}
                  </td>
                  <td className="px-4 py-3 text-right text-earth-600">{p.salesCount}</td>
                  <td className="px-4 py-3 text-right">
                    {p.isActive ? <Badge tone="success">En ligne</Badge> : <Badge tone="danger">Masqué</Badge>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
