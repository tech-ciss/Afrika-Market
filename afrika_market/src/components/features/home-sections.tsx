import Link from "next/link";
import { ArrowRight, Factory, MapPin, Sprout, CalendarDays } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { PLACEHOLDER_IMAGE, parseImages } from "@/lib/images";
import { formatFCFA } from "@/lib/utils";

type HeroProduct = {
  slug: string;
  name: string;
  images: string;
  city: string | null;
  region: string | null;
  producer: { name: string };
};

/**
 * Cadre en arche : arcades d'Abidjan, architecture sahélienne.
 * C'est LA scène animée de la page d'accueil : les trois arches montent l'une après l'autre au chargement.
 */
function Arch({ product, className, delay, priority }: { product: HeroProduct; className: string; delay: number; priority?: boolean }) {
  const cover = parseImages(product.images)[0] ?? PLACEHOLDER_IMAGE;
  return (
    <Link
      href={`/produits/${product.slug}`}
      className={`group relative block animate-arch-in overflow-hidden arch bg-brand-100 shadow-lift ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <SmartImage
        src={cover}
        alt={product.name}
        fill
        priority={priority}
        sizes="(max-width: 1024px) 45vw, 22vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <span className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-sm">
        <span className="block text-sm font-semibold leading-tight text-earth-900 line-clamp-1">{product.name}</span>
        <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-forest-700">
          <MapPin className="h-3 w-3" aria-hidden /> {product.city ?? product.region} · {product.producer.name}
        </span>
      </span>
    </Link>
  );
}

export function Hero({ products }: { products: HeroProduct[] }) {
  const [a, b, c] = products;
  return (
    <section className="relative overflow-hidden">
      <div className="container-page grid items-center gap-10 pb-16 pt-10 sm:pt-14 lg:grid-cols-12 lg:gap-6 lg:pb-24 lg:pt-16">
        <div className="lg:col-span-6 xl:col-span-6">
          <h1 className="display-xl animate-rise text-[2.7rem] text-brand-950 sm:text-6xl xl:text-[4.4rem]">
            Le goût et le geste de l&apos;Afrique de l&apos;Ouest, chez vous
          </h1>
          <p className="mt-6 max-w-xl animate-rise text-lg leading-relaxed text-earth-700 [animation-delay:120ms]">
            Cacao de Soubré, karité de Korhogo, cajou des Savanes, vannerie d&apos;Abidjan. Chaque produit
            affiche son origine et son producteur : vous achetez en direct, en FCFA.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 animate-rise [animation-delay:220ms]">
            <Link href="/produits" className="btn-primary btn-lg">
              Découvrir la boutique
            </Link>
            <Link href="/producteurs" className="btn-secondary btn-lg">
              Rencontrer les producteurs
            </Link>
          </div>
          <p className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-earth-600 animate-rise [animation-delay:320ms]">
            <span className="font-medium text-earth-800">Payez avec</span>
            {["Wave", "Orange Money", "MTN MoMo", "Moov Money", "Carte", "À la livraison"].map((m) => (
              <span key={m} className="rounded-full border border-earth-200 bg-white px-3 py-1 text-xs font-medium text-earth-700">
                {m}
              </span>
            ))}
          </p>
        </div>

        {a && b && c ? (
          <div className="relative mx-auto w-full max-w-md lg:col-span-6 lg:max-w-none">
            {/* Le soleil : grand disque jaune derrière les arches */}
            <div aria-hidden className="absolute left-1/2 top-[12%] w-[84%] -translate-x-1/2">
              <div className="aspect-square animate-rise rounded-full bg-sun-400 [animation-delay:60ms]" />
            </div>
            <div className="relative grid grid-cols-6 items-end gap-3 sm:gap-4">
              <Arch product={b} delay={420} className="col-span-3 aspect-[3/4.4] sm:col-span-2 sm:aspect-[3/5]" />
              <Arch product={a} delay={260} priority className="col-span-3 aspect-[3/5.4] sm:col-span-2 sm:aspect-[3/6.4]" />
              <Arch product={c} delay={580} className="col-span-2 hidden aspect-[3/5.2] sm:block" />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Bandeau défilant des lieux de production : l'origine, c'est la promesse du site. */
export function OriginMarquee({ places }: { places: string[] }) {
  if (places.length === 0) return null;
  const loop = [...places, ...places];
  return (
    <div className="overflow-hidden bg-brand-900 py-4 text-sun-300" aria-label={`Produits de ${places.join(", ")}`}>
      <div className="pause-on-hover flex w-max animate-marquee" aria-hidden>
        {loop.map((place, i) => (
          <span key={`${place}-${i}`} className="flex items-center font-display text-2xl font-semibold tracking-tight">
            <span className="px-6">{place}</span>
            <svg width="14" height="14" viewBox="0 0 14 14" className="text-sun-500" aria-hidden>
              <path d="M7 0 L14 7 L7 14 L0 7 Z" fill="currentColor" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}

type CategoryTile = { id: string; name: string; slug: string; imageUrl: string | null; productCount: number };

/** Catégories en arches : une rangée d'arcades, photo en fond. */
export function CategoryArches({ categories }: { categories: CategoryTile[] }) {
  const main = categories.slice(0, 6);
  const rest = categories.slice(6);
  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
        {main.map((c, i) => (
          <Link key={c.id} href={`/categories/${c.slug}`} className="group block">
            <span className={`relative block aspect-[3/4] overflow-hidden arch bg-brand-100 ${i % 2 === 1 ? "lg:mt-8" : ""}`}>
              <SmartImage
                src={c.imageUrl ?? PLACEHOLDER_IMAGE}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </span>
            <span className="mt-3 block text-center">
              <span className="block font-display text-lg font-bold leading-tight text-brand-950 group-hover:text-brand-700">{c.name}</span>
              <span className="text-xs text-earth-500">{c.productCount} produits</span>
            </span>
          </Link>
        ))}
      </div>
      {rest.length > 0 ? (
        <ul className="mt-10 flex flex-wrap justify-center gap-2">
          {rest.map((c) => (
            <li key={c.id}>
              <Link href={`/categories/${c.slug}`} className="btn-secondary btn-sm">
                {c.name} <span className="text-earth-500">{c.productCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Le « passeport » d'un produit : ce que le client découvre sur chaque fiche. */
export function ProductPassport() {
  const rows = [
    { icon: MapPin, label: "Origine", value: "Côte d'Ivoire, région des Savanes, Korhogo" },
    { icon: Factory, label: "Producteur", value: "Saveurs de Korhogo" },
    { icon: Sprout, label: "Méthode", value: "Séchage solaire sur claies" },
    { icon: CalendarDays, label: "Récolte", value: "Mars à juin" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-md rotate-[-1.5deg] rounded-2xl bg-sun-50 text-earth-900 shadow-lift">
      <div className="flex items-start justify-between rounded-t-2xl bg-sun-400 px-6 py-4 text-brand-950">
        <div>
          <p className="text-sm font-semibold">Passeport du produit</p>
          <p className="font-display text-xl font-extrabold leading-tight">Noix de cajou premium 500 g</p>
        </div>
        <span className="flex h-12 w-12 shrink-0 rotate-12 items-center justify-center rounded-full border-2 border-brand-950 font-display text-sm font-extrabold">
          CI
        </span>
      </div>
      <dl className="divide-y divide-dashed divide-sun-300 px-6">
        {rows.map((r) => (
          <div key={r.label} className="flex gap-3 py-3.5">
            <r.icon className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" aria-hidden />
            <div>
              <dt className="text-xs text-earth-500">{r.label}</dt>
              <dd className="text-sm font-semibold">{r.value}</dd>
            </div>
          </div>
        ))}
      </dl>
      <div className="flex items-center justify-between rounded-b-2xl border-t-2 border-dashed border-sun-300 px-6 py-4">
        <span className="text-xs text-earth-500">Lot AM-0042</span>
        <span className="font-display text-xl font-extrabold text-brand-800">{formatFCFA(5500)}</span>
      </div>
    </div>
  );
}

type ProducerTile = {
  id: string;
  name: string;
  slug: string;
  city: string;
  region: string;
  description: string;
  logoUrl: string | null;
  coverUrl: string | null;
  _count: { products: number };
};

export function ProducerRail({ producers }: { producers: ProducerTile[] }) {
  return (
    <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
      {producers.map((p) => (
        <li key={p.id} className="w-[78%] shrink-0 snap-start sm:w-auto">
          <Link href={`/producteurs/${p.slug}`} className="group block overflow-hidden rounded-xl border border-earth-200 bg-white transition-shadow hover:shadow-lift">
            <span className="relative block aspect-[16/10] overflow-hidden bg-brand-800">
              {p.coverUrl ? (
                <SmartImage
                  src={p.coverUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 78vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              ) : (
                // Pas de bandeau photo : le logo (carré) reste net, sur fond indigo.
                <span className="absolute inset-0 flex items-center justify-center pb-6">
                  <SmartImage
                    src={p.logoUrl ?? PLACEHOLDER_IMAGE}
                    alt=""
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-2xl border-2 border-white/30 bg-white object-cover"
                  />
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-brand-950/70 to-transparent" aria-hidden />
              <span className="absolute bottom-3 left-4 flex items-center gap-1 text-xs font-semibold text-white">
                <MapPin className="h-3 w-3" aria-hidden /> {p.city}, {p.region}
              </span>
            </span>
            <span className="block p-5">
              <span className="block font-display text-xl font-bold leading-tight text-brand-950 group-hover:text-brand-700">{p.name}</span>
              <span className="mt-2 line-clamp-2 block text-sm text-earth-600">{p.description}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-forest-700">
                {p._count.products} produits <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
