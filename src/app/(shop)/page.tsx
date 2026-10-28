import Link from "next/link";
import Image from "next/image";
import { getCategories, getFeaturedProducts, getNewProducts, getSaleProducts } from "@/lib/services/catalog.service";
import type { ProductCard as Card } from "@/lib/services/catalog.service";
import { getApprovedProducers } from "@/lib/services/producer.service";
import { prisma } from "@/lib/db/prisma";
import { ProductCard } from "@/components/features/product-card";
import { NewsletterForm } from "@/components/features/newsletter-form";
import { HeroCarousel, type HeroSlide } from "@/components/features/hero-carousel";
import { Rail, RailItem } from "@/components/features/rail";


function firstImage(p: Card): string {
  return (JSON.parse(p.images || "[]") as string[])[0] ?? "/images/products/placeholder.svg";
}

function toSlideProduct(p: Card) {
  return { slug: p.slug, name: p.name, image: firstImage(p), price: p.price, producer: p.producer.name };
}

export default async function HomePage() {
  const [categories, featured, news, sales, producers, productCount] = await Promise.all([
    getCategories(),
    getFeaturedProducts(8),
    getNewProducts(8),
    getSaleProducts(8),
    getApprovedProducers(),
    prisma.product.count({ where: { isActive: true, producer: { status: "APPROVED" } } }),
  ]);

  // Pool de produits pour illustrer les diapositives (sans doublons).
  const pool: Card[] = [];
  for (const p of [...featured, ...news, ...sales]) if (!pool.some((x) => x.id === p.id)) pool.push(p);

  const used = new Set<string>();
  function pick(keywords: string[], fallbackFrom = 0): Card[] {
    const text = (p: Card) => `${p.region ?? ""} ${p.city ?? ""}`.toLowerCase();
    const matches = pool.filter((p) => !used.has(p.id) && keywords.some((k) => text(p).includes(k)));
    const chosen = matches.slice(0, 3);
    for (const p of pool.slice(fallbackFrom)) {
      if (chosen.length >= 3) break;
      if (!chosen.some((c) => c.id === p.id) && !used.has(p.id)) chosen.push(p);
    }
    chosen.forEach((p) => used.add(p.id));
    return chosen;
  }

  const maxDiscount = sales.reduce((max, p) => {
    if (p.compareAtPrice === null || p.compareAtPrice <= p.price) return max;
    return Math.max(max, Math.round((1 - p.price / p.compareAtPrice) * 100));
  }, 0);

  const rawSlides: HeroSlide[] = [
    {
      id: "korhogo",
      title: "Korhogo",
      text: "Karité, cajou et piment, directement auprès des producteurs de la région des Savanes.",
      href: "/produits?q=Korhogo",
      cta: "Voir les produits de Korhogo",
      tone: "indigo",
      products: pick(["korhogo", "savanes"]).map(toSlideProduct),
    },
    {
      id: "soubre",
      title: "Soubré",
      text: "Cacao, chocolat et fruits séchés de l'une des grandes terres du cacao ivoirien.",
      href: "/produits?q=Soubré",
      cta: "Voir les produits de Soubré",
      tone: "sun",
      products: pick(["soubré", "soubre", "sassandra", "nawa"]).map(toSlideProduct),
    },
    {
      id: "abidjan",
      title: "Abidjan",
      text: "Vannerie, tissages et cosmétiques naturels, livrés en 24 h dans toute l'agglomération.",
      href: "/categories/artisanat-decoration",
      cta: "Découvrir l'artisanat",
      tone: "forest",
      products: pick(["abidjan"]).map(toSlideProduct),
    },
    ...(sales.length > 0
      ? [
          {
            id: "promo",
            title: "Bonnes affaires",
            text: `Une sélection de produits locaux en promotion${maxDiscount > 0 ? `, jusqu'à −${maxDiscount} %` : ""}, dans la limite des stocks.`,
            href: "/produits?promo=1",
            cta: "Voir les promotions",
            tone: "kola" as const,
            products: sales.slice(0, 3).map(toSlideProduct),
          },
        ]
      : []),
  ];
  const slides = rawSlides.filter((s) => s.products.length > 0);

  const trust = [
    { title: "Origine tracée", text: "Région, producteur et méthode sur chaque fiche." },
    { title: "Paiement local", text: "Wave, Orange Money, MTN MoMo, Moov Money, carte ou à la livraison." },
    { title: "Livraison par zones", text: "Abidjan en 24 h, intérieur du pays en 48 à 72 h." },
    { title: "Producteurs soutenus", text: `${producers.length} coopératives, artisans et PME vérifiés.` },
  ];

  const steps = [
    { title: "Découvrez", text: "Recherchez et filtrez par région, catégorie ou producteur." },
    { title: "Vérifiez l'origine", text: "Lisez la fiche produit et le profil du producteur." },
    { title: "Payez en FCFA", text: "Mobile Money, carte ou paiement à la livraison selon la zone." },
    { title: "Recevez", text: "Suivez votre commande jusqu'à la livraison." },
  ];

  return (
    <>
      <h1 className="sr-only">Afrika Market, produits locaux et artisanaux d&apos;Afrique de l&apos;Ouest</h1>

      {slides.length > 0 ? <HeroCarousel slides={slides} /> : null}

      {/* Engagements */}
      <section aria-label="Nos engagements" className="border-b border-earth-200 bg-white">
        <ul className="container-page grid divide-earth-200 sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
          {trust.map((t) => (
            <li key={t.title} className="px-0 py-5 sm:px-6 sm:first:pl-0 sm:last:pr-0">
              <p className="font-display text-base font-bold text-earth-900">{t.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-earth-600">{t.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Catégories */}
      <section className="container-page py-14">
        <Rail
          title="Explorer par catégorie"
          subtitle={`${productCount} produits répartis en ${categories.length} familles, du cacao à la vannerie.`}
          href="/categories"
          linkLabel="Toutes les catégories"
        >
          {categories.slice(0, 12).map((c) => (
            <RailItem key={c.id} className="w-[46%] sm:w-[26%] lg:w-[calc(16.666%-0.84rem)]">
              <Link href={`/categories/${c.slug}`} className="group block">
                <span className="relative block aspect-square overflow-hidden rounded-2xl bg-earth-100">
                  <Image
                    src={c.imageUrl ?? "/images/products/placeholder.svg"}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 46vw, (max-width: 1024px) 26vw, 16vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </span>
                <span className="mt-3 block text-sm font-semibold text-earth-900 group-hover:text-brand-700">{c.name}</span>
                <span className="block text-xs text-earth-500">{c.productCount} produits</span>
              </Link>
            </RailItem>
          ))}
        </Rail>
      </section>

      {/* Nouveautés */}
      <section className="bg-white py-14">
        <div className="container-page">
          <Rail
            title="Nouveautés"
            subtitle="Les dernières récoltes et créations arrivées sur la plateforme."
            href="/produits?tri=newest"
          >
            {news.map((p) => (
              <RailItem key={p.id}>
                <ProductCard product={p} />
              </RailItem>
            ))}
          </Rail>
        </div>
      </section>

      {/* Origine et traçabilité */}
      <section className="bg-brand-950 py-16 text-white">
        <div className="container-page grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <h2 className="text-balance text-3xl font-bold leading-tight sm:text-4xl">
              Vous savez ce que vous achetez, d&apos;où cela vient et qui le fabrique
            </h2>
            <p className="mt-5 max-w-xl text-white/75">
              Chaque fiche produit indique le pays, la région, la ville, le producteur, la méthode de production et la
              période de récolte lorsqu&apos;elle est connue.
            </p>
            <dl className="mt-8 grid max-w-xl divide-y divide-white/15 border-y border-white/15 text-sm">
              {[
                ["Origine", "Pays et région de production"],
                ["Producteur", "Coopérative, artisan ou atelier"],
                ["Méthode", "Mode de fabrication et période de récolte"],
                ["Suivi", "De la préparation jusqu'à la livraison"],
              ].map(([term, def]) => (
                <div key={term} className="flex gap-6 py-3">
                  <dt className="w-24 shrink-0 font-semibold text-sun-300">{term}</dt>
                  <dd className="text-white/80">{def}</dd>
                </div>
              ))}
            </dl>
            <Link href="/mission" className="btn-accent btn-lg mt-9">
              Notre mission
            </Link>
          </div>

          {/* Étiquette d'origine : l'objet signature du site */}
          <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
            <div className="absolute -inset-3 rotate-2 rounded-[2rem] bg-sun-400" aria-hidden />
            <div className="relative rounded-[1.75rem] bg-white p-7 text-earth-900">
              <span className="absolute left-1/2 top-3 h-3 w-3 -translate-x-1/2 rounded-full bg-brand-950" aria-hidden />
              <p className="mt-4 text-xs font-medium text-earth-500">Exemple de fiche d&apos;origine</p>
              <p className="mt-1 font-display text-2xl font-bold leading-tight">Noix de cajou premium 500 g</p>
              <dl className="mt-5 divide-y divide-dashed divide-earth-300 border-y border-dashed border-earth-300 text-sm">
                {[
                  ["Pays", "Côte d'Ivoire"],
                  ["Région", "Savanes, Korhogo"],
                  ["Producteur", "Saveurs de Korhogo"],
                  ["Méthode", "Séchage solaire sur claies"],
                  ["Récolte", "Mars à juin"],
                ].map(([term, def]) => (
                  <div key={term} className="flex justify-between gap-4 py-2.5">
                    <dt className="text-earth-500">{term}</dt>
                    <dd className="text-right font-medium">{def}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 font-display text-2xl font-bold text-brand-800">5 500 FCFA</p>
            </div>
          </div>
        </div>
      </section>

      {/* Promotions */}
      {sales.length > 0 ? (
        <section className="container-page py-14">
          <Rail
            title="Bonnes affaires"
            subtitle="Produits en promotion, dans la limite des stocks."
            href="/produits?promo=1"
          >
            {sales.map((p) => (
              <RailItem key={p.id}>
                <ProductCard product={p} />
              </RailItem>
            ))}
          </Rail>
        </section>
      ) : null}

      {/* Producteurs */}
      <section className="bg-white py-14">
        <div className="container-page">
          <Rail
            title="Nos producteurs"
            subtitle="Coopératives, artisans et PME vérifiés par notre équipe."
            href="/producteurs"
            linkLabel="Tous les producteurs"
          >
            {producers.slice(0, 9).map((p) => (
              <RailItem key={p.id} className="w-[72%] sm:w-[40%] lg:w-[calc(33.333%-0.67rem)]">
                <Link
                  href={`/producteurs/${p.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-earth-200 bg-white transition hover:border-earth-400"
                >
                  <span className="relative block aspect-[16/9] bg-earth-100">
                    <Image
                      src={p.logoUrl ?? "/images/products/placeholder.svg"}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 72vw, (max-width: 1024px) 40vw, 30vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </span>
                  <span className="flex flex-1 flex-col p-5">
                    <span className="font-display text-lg font-bold text-earth-900 group-hover:text-brand-700">{p.name}</span>
                    <span className="mt-0.5 text-sm text-earth-500">
                      {p.city}, {p.region}
                    </span>
                    <span className="mt-3 line-clamp-2 text-sm text-earth-600">{p.description}</span>
                    <span className="mt-4 text-sm font-semibold text-forest-700">{p._count.products} produits</span>
                  </span>
                </Link>
              </RailItem>
            ))}
          </Rail>
        </div>
      </section>

      {/* Comment ça marche : une vraie séquence, donc numérotée */}
      <section className="container-page py-16">
        <h2 className="text-2xl font-bold text-earth-900 sm:text-3xl">Comment ça marche</h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="border-t-2 border-earth-900 pt-4">
              <span className="font-display text-sm font-bold text-brand-700">{i + 1}</span>
              <h3 className="mt-2 font-display text-lg font-bold text-earth-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-earth-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Newsletter */}
      <section id="newsletter" className="container-page pb-6">
        <div className="rounded-3xl bg-sun-100 p-8 sm:p-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-balance text-2xl font-bold text-brand-950 sm:text-3xl">
                Les nouvelles récoltes dans votre boîte mail
              </h2>
              <p className="mt-3 max-w-md text-sm text-earth-700">
                Une fois par mois : nouveautés, histoires de producteurs et offres réservées aux abonnés. Désinscription en un clic.
              </p>
            </div>
            <NewsletterForm source="homepage" />
          </div>
        </div>
      </section>
    </>
  );
}
