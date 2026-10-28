import type { Metadata } from "next";
import Link from "next/link";
import { formatFCFA } from "@/lib/utils";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getProducerByUserId } from "@/lib/services/producer.service";
import { toggleProductAction, updateStockAction } from "@/actions/producer";
import { Badge } from "@/components/ui/surfaces";
import { EmptyState } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Mes produits" };

async function updateStockFormAction(formData: FormData) {
  "use server";
  await updateStockAction({}, formData);
}

async function toggleProductFormAction(formData: FormData) {
  "use server";
  await toggleProductAction(formData);
}

export default async function ProducerProductsPage() {
  const user = await requireRole("PRODUCER", "ADMIN", "SUPER_ADMIN");
  const producer = await getProducerByUserId(user.id);
  if (!producer) return null;

  const products = await prisma.product.findMany({
    where: { producerId: producer.id },
    include: { category: { select: { name: true } }, variants: { select: { id: true, name: true, price: true, stock: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="text-lg font-bold text-earth-900">Mes produits ({products.length})</h2>

      {products.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="Aucun produit publié"
            description="Publiez votre premier produit pour le rendre visible dans la boutique."
            action={
              <Link href="/vendeur/produits/nouveau" className="btn-primary btn-md">
                Ajouter un produit
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {products.map((p) => {
            const images = JSON.parse(p.images || "[]") as string[];
            return (
              <div key={p.id} className="grid gap-4 rounded-2xl border border-earth-200 bg-white p-4 lg:grid-cols-[80px_1fr_auto]">
                <span className="h-20 w-20 overflow-hidden rounded-xl bg-earth-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={images[0] ?? "/images/products/placeholder.svg"} alt="" className="h-full w-full object-cover" loading="lazy" />
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-earth-900">{p.name}</h3>
                    {p.isActive ? <Badge tone="success">En ligne</Badge> : <Badge tone="danger">Désactivé</Badge>}
                    {p.compareAtPrice ? <Badge tone="brand">Promo</Badge> : null}
                    {p.stock === 0 ? <Badge tone="danger">Rupture</Badge> : p.stock <= p.lowStockThreshold ? <Badge tone="warning">Stock bas</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs text-earth-500">
                    {p.category.name} · {formatFCFA(p.price)} / {p.unit} · Ventes : {p.salesCount}
                  </p>
                  {p.variants.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-2 text-xs text-earth-600">
                      {p.variants.map((v) => (
                        <li key={v.id} className="rounded-lg bg-earth-50 px-2 py-1">
                          {v.name} · {formatFCFA(v.price)} · stock {v.stock}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <form action={updateStockFormAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <label className="sr-only" htmlFor={`stock-${p.id}`}>
                      Stock de {p.name}
                    </label>
                    <input
                      id={`stock-${p.id}`}
                      name="stock"
                      type="number"
                      min={0}
                      defaultValue={p.stock}
                      className="w-20 rounded-lg border border-earth-300 px-2 py-1.5 text-sm"
                    />
                    <button type="submit" className="btn-secondary btn-sm">
                      Stock
                    </button>
                  </form>
                  <Link href={`/vendeur/produits/${p.id}`} className="btn-secondary btn-sm">
                    Modifier
                  </Link>
                  <form action={toggleProductFormAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className="btn-ghost btn-sm">
                      {p.isActive ? "Désactiver" : "Activer"}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
