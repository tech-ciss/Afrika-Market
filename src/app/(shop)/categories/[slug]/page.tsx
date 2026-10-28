import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug, searchProducts, getCategories } from "@/lib/services/catalog.service";
import { ProductCard } from "@/components/features/product-card";
import { EmptyState, Pagination } from "@/components/ui/feedback";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Catégorie introuvable" };
  return { title: category.name, description: category.description ?? undefined };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const [category, all] = await Promise.all([getCategoryBySlug(slug), getCategories()]);
  if (!category) notFound();

  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const products = await searchProducts({ category: slug, page, perPage: 12, sort: "sales" });

  const node = all.find((c) => c.slug === slug);
  const parent = all.find((c) => c.children.some((s) => s.slug === slug));

  return (
    <div className="container-page py-10">
      <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-earth-500">
        <Link href="/" className="hover:text-brand-700">Accueil</Link> /{" "}
        <Link href="/categories" className="hover:text-brand-700">Catégories</Link> /{" "}
        <span className="text-earth-800">{category.name}</span>
      </nav>

      <div className="rounded-3xl border border-earth-200 bg-white p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-earth-900">{category.name}</h1>
        {category.description ? <p className="mt-2 max-w-3xl text-sm text-earth-600">{category.description}</p> : null}
        <p className="mt-3 text-sm font-semibold text-brand-700">{products.total} produit(s)</p>

        {node && node.children.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {node.children.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/categories/${s.slug}`}
                  className="rounded-full bg-earth-100 px-3 py-1.5 text-sm text-earth-700 hover:bg-brand-50 hover:text-brand-700"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {parent ? (
          <p className="mt-3 text-xs text-earth-500">
            Sous-catégorie de{" "}
            <Link href={`/categories/${parent.slug}`} className="underline hover:text-brand-700">
              {parent.name}
            </Link>
          </p>
        ) : null}
      </div>

      <div className="mt-6">
        {products.items.length === 0 ? (
          <EmptyState
            title="Aucun produit dans cette catégorie"
            description="Les producteurs publient régulièrement de nouveaux produits. Revenez bientôt."
            action={
              <Link href="/produits" className="btn-primary btn-md">
                Parcourir toute la boutique
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {products.items.map((p, i) => (
                <ProductCard key={p.id} product={p} headingLevel="h2" priority={i < 4} />
              ))}
            </div>
            <Pagination
              page={products.page}
              pageCount={products.pageCount}
              basePath={`/categories/${slug}`}
              searchParams={{}}
            />
          </>
        )}
      </div>
    </div>
  );
}
