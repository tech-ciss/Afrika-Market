import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getProducerByUserId } from "@/lib/services/producer.service";
import { toggleProductAction, updateStockAction } from "@/actions/producer";
import { coverImage } from "@/lib/images";
import { Badge } from "@/components/ui/surfaces";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { SmartImage } from "@/components/ui/smart-image";

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

  const online = products.filter((p) => p.isActive).length;
  const soldOut = products.filter((p) => p.stock === 0).length;

  return (
    <div>
      <PageHeader
        title="Mes produits"
        description={
          products.length === 0
            ? "Publiez votre premier produit pour le rendre visible dans la boutique."
            : `${products.length} produit${products.length > 1 ? "s" : ""} · ${online} en ligne${soldOut > 0 ? ` · ${soldOut} en rupture` : ""}`
        }
        actions={
          <Link href="/vendeur/produits/nouveau" className="btn-primary btn-md lg:hidden">
            <Plus className="h-4 w-4" aria-hidden /> Ajouter
          </Link>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          title="Aucun produit publié"
          description="Ajoutez une photo, un prix, un stock et l'origine : c'est ce qui fait la valeur de votre fiche."
          action={
            <Link href="/vendeur/produits/nouveau" className="btn-primary btn-md">
              Ajouter un produit
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-earth-100 overflow-hidden rounded-2xl border border-earth-200 bg-white">
          {products.map((p) => (
            <li key={p.id} className="grid grid-cols-[72px_1fr] gap-4 p-4 sm:p-5 lg:grid-cols-[72px_1fr_auto] lg:items-center">
              <span className="relative h-[72px] w-[72px] overflow-hidden rounded-xl bg-earth-100">
                <SmartImage src={coverImage(p.images)} alt="" fill sizes="72px" className={`object-cover ${p.isActive ? "" : "grayscale"}`} />
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h2 className="font-sans text-base font-semibold tracking-normal text-earth-900">{p.name}</h2>
                  {p.isActive ? <Badge tone="success">En ligne</Badge> : <Badge tone="neutral">Désactivé</Badge>}
                  {p.compareAtPrice ? <Badge tone="brand">Promo</Badge> : null}
                  {p.stock === 0 ? (
                    <Badge tone="danger">Rupture</Badge>
                  ) : p.stock <= p.lowStockThreshold ? (
                    <Badge tone="warning">Stock bas</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-earth-500">
                  {p.category.name} · <span className="font-semibold text-brand-800">{formatFCFA(p.price)}</span> / {p.unit} · {p.salesCount} vendu
                  {p.salesCount > 1 ? "s" : ""}
                </p>
                {p.variants.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5 text-xs text-earth-600">
                    {p.variants.map((v) => (
                      <li key={v.id} className="rounded-full bg-earth-100 px-2.5 py-1">
                        {v.name} · {formatFCFA(v.price)} · stock {v.stock}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="col-span-2 flex flex-wrap items-center gap-2 lg:col-span-1">
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
                    className="w-20 rounded-full border border-earth-300 bg-white px-3 py-1.5 text-center text-sm tabular-nums focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
