import Link from "next/link";
import Image from "next/image";
import { formatFCFA } from "@/lib/utils";
import { Stars } from "@/components/ui/feedback";
import type { ProductCard as ProductCardType } from "@/lib/services/catalog.service";

/** Carte produit : l'origine reste toujours visible (§8 et §24), sans décoration superflue. */
export function ProductCard({
  product,
  priority = false,
  headingLevel = "h3",
}: {
  product: ProductCardType;
  priority?: boolean;
  /** "h2" quand aucun titre de section ne précède la grille (liste produits, catégorie, favoris). */
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const images = JSON.parse(product.images || "[]") as string[];
  const cover = images[0] ?? "/images/products/placeholder.svg";
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const discount = onSale ? Math.round((1 - product.price / product.compareAtPrice!) * 100) : 0;
  const origin = product.region ?? product.city ?? product.country.name;
  const lowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;

  return (
    <article className="group flex h-full flex-col">
      <Link
        href={`/produits/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-2xl bg-earth-100"
        tabIndex={-1}
        aria-hidden
      >
        <Image
          src={cover}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 640px) 62vw, (max-width: 1024px) 34vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        {onSale ? <span className="badge-sale">−{discount} %</span> : product.isNew ? <span className="badge-new">Nouveau</span> : null}
        {product.stock === 0 ? (
          <span className="absolute inset-x-0 bottom-0 bg-brand-950/85 py-2 text-center text-xs font-semibold text-white">
            Rupture de stock
          </span>
        ) : null}
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <p className="flex items-center gap-1.5 text-xs font-medium text-forest-700">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-forest-500" aria-hidden />
          <span className="truncate">{origin}</span>
        </p>

        <Heading className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-earth-900">
          <Link href={`/produits/${product.slug}`} className="hover:text-brand-700 hover:underline underline-offset-2">
            {product.name}
          </Link>
        </Heading>

        <p className="mt-0.5 truncate text-xs text-earth-500">{product.producer.name}</p>

        {product.reviewCount > 0 ? (
          <p className="mt-1.5 flex items-center gap-1.5">
            <Stars value={product.averageRating} size={12} />
            <span className="text-xs text-earth-500">({product.reviewCount})</span>
          </p>
        ) : null}

        <div className="mt-auto pt-3">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-lg font-bold text-brand-800">{formatFCFA(product.price)}</span>
            {onSale ? (
              <span className="text-xs text-earth-400 line-through">{formatFCFA(product.compareAtPrice!)}</span>
            ) : null}
            <span className="text-xs text-earth-500">/ {product.unit}</span>
          </p>
          {lowStock ? <p className="mt-1 text-xs font-medium text-kola-700">Plus que {product.stock} en stock</p> : null}
        </div>
      </div>
    </article>
  );
}
