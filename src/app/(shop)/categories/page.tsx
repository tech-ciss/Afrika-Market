import type { Metadata } from "next";
import Link from "next/link";
import { SmartImage } from "@/components/ui/smart-image";
import { PLACEHOLDER_IMAGE } from "@/lib/images";
import { getCategories } from "@/lib/services/catalog.service";

export const metadata: Metadata = {
  title: "Catégories",
  description: "Toutes les catégories d'AFRIKA MARKET : alimentation, boissons, épices, fruits & noix, cacao, café, miel, céréales, cosmétique, artisanat et coffrets cadeaux.",
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="container-page py-10">
      <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-earth-500">
        <Link href="/" className="hover:text-brand-700">
          Accueil
        </Link> / <span className="text-earth-800">Catégories</span>
      </nav>
      <h1 className="text-3xl font-bold text-earth-900">Nos catégories</h1>
      <p className="mt-2 max-w-2xl text-sm text-earth-600">
        Chaque catégorie regroupe les produits des producteurs et coopératives vérifiés par AFRIKA MARKET.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div key={c.id} className="overflow-hidden rounded-2xl border border-earth-200 bg-white shadow-card">
            <Link href={`/categories/${c.slug}`} className="relative block h-48 overflow-hidden bg-earth-100">
              <SmartImage
                src={c.imageUrl ?? PLACEHOLDER_IMAGE}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out hover:scale-105"
              />
            </Link>
            <div className="p-4">
              <h2 className="text-lg font-semibold text-earth-900">
                <Link href={`/categories/${c.slug}`} className="hover:text-brand-700">
                  {c.name}
                </Link>
              </h2>
              {c.children.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {c.children.map((s) => (
                    <li key={s.slug}>
                      <Link
                        href={`/categories/${s.slug}`}
                        className="rounded-full bg-earth-100 px-2.5 py-1 text-xs text-earth-600 hover:bg-brand-50 hover:text-brand-700"
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-3 text-sm font-semibold text-brand-700">{c.productCount} produits →</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
