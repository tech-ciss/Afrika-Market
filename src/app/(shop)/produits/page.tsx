import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, SlidersHorizontal } from "lucide-react";
import { getCatalogFacets, searchProducts, type SortKey } from "@/lib/services/catalog.service";
import { ProductCard } from "@/components/features/product-card";
import { EmptyState, Pagination } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/surfaces";
import { CatalogFiltersPanel } from "@/components/features/catalog-filters";
import { SortSelect } from "@/components/features/sort-select";

export const metadata: Metadata = {
  title: "Boutique — tous les produits locaux",
  description:
    "Catalogue AFRIKA MARKET : alimentation, épices, cosmétique naturelle, artisanat et coffrets d'Afrique de l'Ouest, avec filtres par prix, pays, région et producteur.",
};

type Params = Record<string, string | string[] | undefined>;

const SORTS: SortKey[] = ["relevance", "price-asc", "price-desc", "newest", "rating", "sales"];

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function num(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;

  const rawSort = one(sp.tri);
  const sort: SortKey = SORTS.includes(rawSort as SortKey) ? (rawSort as SortKey) : "relevance";

  const filters = {
    q: one(sp.q),
    category: one(sp.cat),
    country: one(sp.pays),
    region: one(sp.region),
    producer: one(sp.vendeur),
    minPrice: num(one(sp.prix_min)),
    maxPrice: num(one(sp.prix_max)),
    inStock: one(sp.stock) === "1",
    isNew: one(sp.nouveau) === "1",
    onSale: one(sp.promo) === "1",
    minRating: num(one(sp.note)),
    sort,
    page: num(one(sp.page)) ?? 1,
    perPage: 12,
  };

  const [products, facets] = await Promise.all([searchProducts(filters), getCatalogFacets()]);
  const activeFilters = [
    filters.q && { key: "q", label: `« ${filters.q} »` },
    filters.category && { key: "cat", label: `Catégorie` },
    filters.country && { key: "pays", label: `Pays : ${facets.countries.find((c) => c.code === filters.country)?.name}` },
    filters.region && { key: "region", label: `Région : ${filters.region}` },
    filters.producer && { key: "vendeur", label: `Producteur : ${facets.producers.find((p) => p.slug === filters.producer)?.name}` },
    filters.minPrice && { key: "prix_min", label: `Min ${filters.minPrice} F` },
    filters.maxPrice && { key: "prix_max", label: `Max ${filters.maxPrice} F` },
    filters.inStock && { key: "stock", label: "En stock" },
    filters.isNew && { key: "nouveau", label: "Nouveautés" },
    filters.onSale && { key: "promo", label: "En promotion" },
    filters.minRating && { key: "note", label: `Note ≥ ${filters.minRating}` },
  ].filter(Boolean) as { key: string; label: string }[];

  const activeQuery: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(sp)) {
    activeQuery[k] = one(v);
  }

  return (
    <div className="container-page py-8">
      <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-earth-500">
        <Link href="/" className="hover:text-brand-700">
          Accueil
        </Link>{" "}
        / <span className="text-earth-800">Boutique</span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-earth-900">
            {filters.q ? `Résultats pour « ${filters.q} »` : "Tous les produits"}
          </h1>
          <p className="mt-1 text-sm text-earth-600">
            {products.total} produit(s) · prix en FCFA · expédié de Côte d&apos;Ivoire
          </p>
        </div>
        <SortSelect value={sort} />
      </div>

      {activeFilters.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <Link key={f.key} href={clearParam(activeQuery, f.key)}>
              <Badge tone="brand" className="cursor-pointer hover:brightness-95">
                {f.label} ✕
              </Badge>
            </Link>
          ))}
          <Link href="/produits" className="text-xs font-semibold text-earth-500 underline hover:text-brand-700">
            Tout effacer
          </Link>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-40 lg:h-fit">
          <CatalogFiltersPanel facets={facets} current={filters} query={activeQuery} />
        </aside>

        <section>
          {products.items.length === 0 ? (
            <EmptyState
              icon={<SearchX className="h-10 w-10" />}
              title="Aucun produit ne correspond à votre recherche"
              description="Essayez d'élargir les filtres : retirez une fourchette de prix ou changez de catégorie."
              action={
                <Link href="/produits" className="btn-primary btn-md">
                  <SlidersHorizontal className="h-4 w-4" /> Réinitialiser les filtres
                </Link>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {products.items.map((p, i) => (
                  <ProductCard key={p.id} product={p} headingLevel="h2" priority={i < 4} />
                ))}
              </div>
              <Pagination
                page={products.page}
                pageCount={products.pageCount}
                basePath="/produits"
                searchParams={activeQuery}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function clearParam(query: Record<string, string | undefined>, key: string): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v && k !== key) params.set(k, v);
  }
  const qs = params.toString();
  return `/produits${qs ? `?${qs}` : ""}`;
}
