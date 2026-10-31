import Link from "next/link";
import { MapPin } from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { parseImages, PLACEHOLDER_IMAGE } from "@/lib/images";
import { Stars } from "@/components/ui/feedback";
import { SmartImage } from "@/components/ui/smart-image";
import type { ProductCard as ProductCardType } from "@/lib/services/catalog.service";

/**
 * Carte produit (§8 et §24) : la photo d'abord, l'origine toujours visible sur la photo.
 * Si le produit a une deuxième photo, elle apparaît au survol.
 */
export function ProductCard({ product, priority = false }: { product: ProductCardType; priority?: boolean }) {
  const images = parseImages(product.images);
  const cover = images[0] ?? PLACEHOLDER_IMAGE;
  const alt = images[1];
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const discount = onSale ? Math.round((1 - product.price / product.compareAtPrice!) * 100) : 0;
  const origin = product.city ?? product.region ?? product.country.name;
  const soldOut = product.stock === 0;
  const sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";

  return (
    <article className="group relative flex h-full flex-col">
      <Link
        href={`/produits/${product.slug}`}
        className="relative block aspect-[5/6] overflow-hidden rounded-xl bg-earth-100"
        aria-label={product.name}
      >
        <SmartImage
          src={cover}
          alt={product.name}
          fill
          priority={priority}
          sizes={sizes}
          className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] ${soldOut ? "grayscale" : ""}`}
        />
        {alt ? (
          <SmartImage
            src={alt}
            alt=""
            aria-hidden
            fill
            sizes={sizes}
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        ) : null}

        {onSale ? <span className="badge-sale">-{discount}%</span> : product.isNew ? <span className="badge-new">Nouveau</span> : null}

        {soldOut ? (
          <span className="absolute right-3 top-3 rounded-full bg-earth-900/85 px-2.5 py-0.5 text-[11px] font-semibold text-white">
            Rupture
          </span>
        ) : product.stock <= product.lowStockThreshold ? (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold text-kola-600">
            Plus que {product.stock}
          </span>
        ) : null}

        <span className="absolute bottom-3 left-3 inline-flex max-w-[85%] items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-forest-700 shadow-sm">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">{origin}</span>
        </span>
      </Link>

      <div className="flex flex-1 flex-col pt-3">
        <h3 className="font-sans text-sm font-semibold leading-snug tracking-normal text-earth-900">
          <Link href={`/produits/${product.slug}`} className="hover:text-brand-700">
            {product.name}
          </Link>
        </h3>
        <p className="mt-0.5 text-xs text-earth-500">{product.producer.name}</p>

        {product.reviewCount > 0 ? (
          <p className="mt-1.5 flex items-center gap-1.5">
            <Stars value={product.averageRating} size={12} />
            <span className="text-[11px] text-earth-500">({product.reviewCount})</span>
          </p>
        ) : null}

        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-2">
          <span className="font-display text-lg font-bold text-brand-800">{formatFCFA(product.price)}</span>
          {onSale ? <span className="text-xs text-earth-500 line-through">{formatFCFA(product.compareAtPrice!)}</span> : null}
          <span className="text-[11px] text-earth-500">/ {product.unit}</span>
        </p>
      </div>
    </article>
  );
}
