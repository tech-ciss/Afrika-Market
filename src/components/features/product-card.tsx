import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { Stars } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/surfaces";
import type { ProductCard as ProductCardType } from "@/lib/services/catalog.service";

/** Carte produit : origine toujours visible (§8 et §24). */
export function ProductCard({ product, priority = false }: { product: ProductCardType; priority?: boolean }) {
  const images = JSON.parse(product.images || "[]") as string[];
  const cover = images[0] ?? "/images/products/placeholder.svg";
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const discount = onSale ? Math.round((1 - product.price / product.compareAtPrice!) * 100) : 0;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-earth-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/produits/${product.slug}`} className="relative block aspect-square overflow-hidden bg-earth-100">
        <Image
          src={cover}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        {product.isNew && !onSale ? <span className="badge-new">Nouveau</span> : null}
        {onSale ? <span className="badge-sale">-{discount}%</span> : null}
        {product.stock === 0 ? (
          <span className="absolute right-3 top-3 rounded-full bg-earth-900/80 px-2 py-0.5 text-[11px] font-semibold text-white">
            Rupture
          </span>
        ) : product.stock <= product.lowStockThreshold ? (
          <span className="absolute right-3 top-3 rounded-full bg-amber-500/90 px-2 py-0.5 text-[11px] font-semibold text-white">
            Plus que {product.stock}
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-3.5">
        <p className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-forest-700">
          <MapPin className="h-3 w-3" aria-hidden />
          <span className="truncate">
            {product.country.name} · {product.region ?? product.city ?? ""}
          </span>
        </p>

        <h3 className="text-sm font-semibold leading-snug text-earth-900">
          <Link href={`/produits/${product.slug}`} className="hover:text-brand-700">
            {product.name}
          </Link>
        </h3>

        <p className="mt-1 text-xs text-earth-500">{product.producer.name}</p>

        {product.reviewCount > 0 ? (
          <p className="mt-1.5 flex items-center gap-1.5">
            <Stars value={product.averageRating} size={12} />
            <span className="text-[11px] text-earth-500">({product.reviewCount})</span>
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            {onSale ? (
              <p className="text-xs text-earth-400 line-through">{formatFCFA(product.compareAtPrice!)}</p>
            ) : null}
            <p className="text-base font-bold text-brand-700">{formatFCFA(product.price)}</p>
            <p className="text-[11px] text-earth-500">/ {product.unit}</p>
          </div>
          {onSale ? <Badge tone="brand">Promo</Badge> : null}
        </div>
      </div>
    </article>
  );
}
