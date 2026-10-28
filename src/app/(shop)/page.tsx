import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  HeartHandshake,
  MapPin,
  Route,
  ShieldCheck,
  Smartphone,
  Truck,
} from "lucide-react";
import { getCategories, getFeaturedProducts, getNewProducts, getSaleProducts } from "@/lib/services/catalog.service";
import { getApprovedProducers } from "@/lib/services/producer.service";
import { ProductCard } from "@/components/features/product-card";
import { NewsletterForm } from "@/components/features/newsletter-form";
import { Badge } from "@/components/ui/surfaces";

export default async function HomePage() {
  const [categories, featured, news, sales, producers] = await Promise.all([
    getCategories(),
    getFeaturedProducts(8),
    getNewProducts(8),
    getSaleProducts(8),
    getApprovedProducers(),
  ]);

  const trust = [
    { icon: MapPin, title: "Origine tracée", text: "Région, producteur et méthode de production sur chaque fiche." },
    { icon: Banknote, title: "Paiement local", text: "Wave, Orange Money, MTN, Moov, carte ou paiement à la livraison." },
    { icon: Truck, title: "Livraison par zones", text: "Abidjan en 24 h, villes de l'intérieur en 48 à 72 h." },
    { icon: HeartHandshake, title: "Producteurs valorisés", text: "Chaque achat soutient une coopérative ou un artisan." },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-earth-800 text-white">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="container-page relative grid gap-8 py-14 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge tone="brand" className="mb-5 bg-white/15 px-3 py-1.5 text-white ring-white/20">
              🌍 Made in West Africa
            </Badge>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Le savoir-faire ouest-africain, <span className="text-brand-100">livré chez vous</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">
              Cacao de Soubré, karité de Korhogo, cajou des Savanes, vannerie d&apos;Abidjan… Découvrez la
              provenance de chaque produit et achetez directement auprès de ceux qui le fabriquent.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/produits" className="btn btn-lg bg-white text-brand-800 hover:bg-brand-50">
                Découvrir la boutique <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/producteurs"
                className="btn btn-lg border border-white/40 text-white hover:bg-white/10"
              >
                Rencontrer les producteurs
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/20 pt-6">
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/70">Producteurs</dt>
                <dd className="text-2xl font-bold">{producers.length}+</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/70">Produits</dt>
                <dd className="text-2xl font-bold">{featured.length + news.length}+</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/70">Paiement</dt>
                <dd className="text-2xl font-bold">FCFA</dd>
              </div>
            </dl>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {featured.slice(0, 4).map((p, i) => (
              <Link
                key={p.id}
                href={`/produits/${p.slug}`}
                className={`group block overflow-hidden rounded-3xl bg-white/10 p-2 backdrop-blur transition hover:bg-white/20 ${
                  i % 2 === 1 ? "translate-y-6" : ""
                }`}
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={(JSON.parse(p.images || "[]") as string[])[0] ?? "/images/products/placeholder.svg"}
                    alt={p.name}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <p className="mt-2 px-1 text-sm font-semibold leading-snug line-clamp-2">{p.name}</p>
                <p className="px-1 pb-1 text-xs text-white/70">{p.producer.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bandeau confiance */}
      <section className="border-b border-earth-200 bg-white">
        <div className="container-page grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {trust.map((t) => (
            <div key={t.title} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <t.icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-earth-900">{t.title}</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-earth-600">{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Catégories */}
      <section className="container-page py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-earth-900">Explorer par catégorie</h2>
            <p className="mt-1 text-sm text-earth-600">Douze familles de produits, du cacao à la vannerie.</p>
          </div>
          <Link href="/categories" className="hidden text-sm font-semibold text-brand-700 hover:underline sm:block">
            Tout voir →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.slice(0, 12).map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-earth-200 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card"
            >
              <span className="relative block h-16 w-16 overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.imageUrl ?? "/images/products/placeholder.svg"} alt="" className="h-full w-full object-cover" loading="lazy" />
              </span>
              <span className="text-sm font-semibold text-earth-800 group-hover:text-brand-700">{c.name}</span>
              <span className="text-[11px] text-earth-500">{c.productCount} produits</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Nouveautés */}
      <section className="bg-white py-12">
        <div className="container-page">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-earth-900">Nouveautés</h2>
              <p className="mt-1 text-sm text-earth-600">Les dernières récoltes et créations arrivées sur la plateforme.</p>
            </div>
            <Link href="/produits?tri=newest" className="text-sm font-semibold text-brand-700 hover:underline">
              Tout voir →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {news.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        </div>
      </section>

      {/* Origine & traçabilité */}
      <section className="container-page py-12">
        <div className="overflow-hidden rounded-3xl bg-forest-800 text-white">
          <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge tone="success" className="bg-white/10 text-forest-100 ring-white/20">
                <BadgeCheck className="h-3.5 w-3.5" /> Origine &amp; traçabilité
              </Badge>
              <h2 className="mt-4 text-3xl font-bold leading-tight">
                Vous savez ce que vous achetez, d&apos;où ça vient et qui le fabrique
              </h2>
              <p className="mt-4 text-white/80">
                Chaque fiche produit affiche le pays, la région, la ville, le producteur, la méthode de production
                et la période de récolte lorsque celle-ci est disponible.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Pays et région d'origine",
                  "Producteur, coopérative ou atelier",
                  "Méthode de production et période de récolte",
                  "Parcours de la commande jusqu'à la livraison",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/mission" className="btn btn-md mt-8 bg-white text-forest-800 hover:bg-forest-50">
                Notre mission <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-2xl bg-white/10 p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-200">Exemple de fiche</p>
              <div className="mt-4 rounded-xl bg-white p-5 text-earth-900 shadow-card">
                <p className="text-lg font-bold">Noix de cajou premium 500 g</p>
                <p className="mt-3 flex items-center gap-2 text-sm">🇨🇮 Côte d&apos;Ivoire</p>
                <p className="mt-1 flex items-center gap-2 text-sm">📍 Région des Savanes · Korhogo</p>
                <p className="mt-1 flex items-center gap-2 text-sm">🏭 Saveurs de Korhogo</p>
                <p className="mt-1 flex items-center gap-2 text-sm">🌿 Séchage solaire sur claies · Récolte mars – juin</p>
                <p className="mt-4 border-t border-earth-100 pt-3 text-base font-bold text-brand-700">
                  5 500 FCFA
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promotions */}
      {sales.length > 0 ? (
        <section className="bg-white py-12">
          <div className="container-page">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-earth-900">Bonnes affaires</h2>
                <p className="mt-1 text-sm text-earth-600">Produits en promotion, dans la limite des stocks.</p>
              </div>
              <Link href="/produits?promo=1" className="text-sm font-semibold text-brand-700 hover:underline">
                Tout voir →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {sales.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Producteurs */}
      <section className="container-page py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-earth-900">Nos producteurs</h2>
            <p className="mt-1 text-sm text-earth-600">Coopératives, artisans et PME vérifiés par notre équipe.</p>
          </div>
          <Link href="/producteurs" className="text-sm font-semibold text-brand-700 hover:underline">
            Tous les producteurs →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {producers.slice(0, 6).map((p) => (
            <Link
              key={p.id}
              href={`/producteurs/${p.slug}`}
              className="group flex gap-4 rounded-2xl border border-earth-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-earth-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.logoUrl ?? "/images/products/placeholder.svg"} alt="" className="h-full w-full object-cover" loading="lazy" />
              </span>
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-earth-900 group-hover:text-brand-700">{p.name}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-earth-500">
                  <MapPin className="h-3 w-3" /> {p.city}, {p.region}
                </p>
                <p className="mt-2 line-clamp-2 text-xs text-earth-600">{p.description}</p>
                <p className="mt-2 text-xs font-semibold text-forest-700">{p._count.products} produits</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="bg-white py-12">
        <div className="container-page">
          <h2 className="text-2xl font-bold text-earth-900">Comment ça marche</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Smartphone, title: "1. Découvrez", text: "Recherchez, filtrez par région, catégorie ou producteur." },
              { icon: Route, title: "2. Vérifiez l'origine", text: "Consultez la fiche produit et le profil du producteur." },
              { icon: Banknote, title: "3. Payez en FCFA", text: "Mobile Money, carte ou paiement à la livraison selon la zone." },
              { icon: Truck, title: "4. Recevez", text: "Suivez votre commande jusqu'à la livraison." },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl border border-earth-200 bg-earth-50 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <s.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-earth-900">{s.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-earth-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section id="newsletter" className="container-page py-12">
        <div className="rounded-3xl border border-brand-100 bg-brand-50 p-8 sm:p-10">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-bold text-earth-900">Restez informé des nouvelles récoltes</h2>
              <p className="mt-2 text-sm text-earth-600">
                Une fois par mois : nouveautés, histoires de producteurs et offres réservées aux abonnés.
              </p>
              <p className="mt-3 flex items-center gap-2 text-xs text-earth-500">
                <ShieldCheck className="h-4 w-4 text-forest-600" /> Pas de spam, désinscription en un clic.
              </p>
            </div>
            <NewsletterForm source="homepage" />
          </div>
        </div>
      </section>
    </>
  );
}
