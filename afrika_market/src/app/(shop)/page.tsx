import Link from "next/link";
import { getCategories, getFeaturedProducts, getNewProducts, getSaleProducts } from "@/lib/services/catalog.service";
import { getApprovedProducers } from "@/lib/services/producer.service";
import { ProductCard } from "@/components/features/product-card";
import { NewsletterForm } from "@/components/features/newsletter-form";
import { CategoryArches, Hero, OriginMarquee, ProducerRail, ProductPassport } from "@/components/features/home-sections";

function SectionHead({
  title,
  text,
  href,
  linkLabel = "Tout voir",
  dark = false,
}: {
  title: string;
  text?: string;
  href?: string;
  linkLabel?: string;
  dark?: boolean;
}) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end sm:gap-4">
      <div>
        <h2 className={`font-display text-3xl font-extrabold sm:text-4xl ${dark ? "text-white" : "text-brand-950"}`}>{title}</h2>
        {text ? <p className={`mt-2 max-w-xl text-base ${dark ? "text-white/75" : "text-earth-600"}`}>{text}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="shrink-0 py-2 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

const STEPS = [
  { title: "Découvrez", text: "Recherchez, filtrez par région, catégorie ou producteur." },
  { title: "Vérifiez l'origine", text: "Consultez la fiche produit et le profil du producteur." },
  { title: "Payez en FCFA", text: "Mobile Money, carte ou paiement à la livraison selon la zone." },
  { title: "Recevez", text: "Suivez votre commande jusqu'à la livraison." },
];

export default async function HomePage() {
  const [categories, featured, news, sales, producers] = await Promise.all([
    getCategories(),
    getFeaturedProducts(8),
    getNewProducts(8),
    getSaleProducts(8),
    getApprovedProducers(),
  ]);

  // Lieux de production uniques, pour le bandeau défilant.
  const places = Array.from(new Set(producers.map((p) => p.city)));

  return (
    <>
      <Hero products={featured.slice(0, 3)} />
      <OriginMarquee places={places} />

      <section className="py-16 sm:py-20">
        <div className="container-page">
          <SectionHead
            title="Du cacao à la vannerie"
            text="Douze familles de produits, chacune avec ses producteurs et ses régions."
            href="/categories"
            linkLabel="Toutes les catégories"
          />
          <CategoryArches categories={categories.slice(0, 12)} />
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="container-page">
          <SectionHead
            title="Les dernières récoltes"
            text="Nouveautés arrivées sur la plateforme ces dernières semaines."
            href="/produits?tri=newest"
          />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {news.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        </div>
      </section>

      <section className="on-dark bg-brand-900 text-white">
        <div className="weave" aria-hidden />
        <div className="container-page grid gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-extrabold text-white sm:text-5xl">
              Vous savez ce que vous achetez, d&apos;où ça vient et qui le fabrique
            </h2>
            <p className="mt-5 max-w-lg text-lg text-white/80">
              Chaque fiche produit affiche le pays, la région, la ville, le producteur, la méthode de production et la
              période de récolte quand elle est connue.
            </p>
            <ul className="mt-8 space-y-3 text-white/90">
              {[
                "Pays et région d'origine",
                "Producteur, coopérative ou atelier",
                "Méthode de production et période de récolte",
                "Suivi de la commande jusqu'à la livraison",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <svg width="12" height="12" viewBox="0 0 14 14" className="shrink-0 text-sun-400" aria-hidden>
                    <path d="M7 0 L14 7 L7 14 L0 7 Z" fill="currentColor" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/mission" className="btn-sun btn-lg mt-10">
              Notre mission
            </Link>
          </div>
          <ProductPassport />
        </div>
        <div className="weave" aria-hidden />
      </section>

      {sales.length > 0 ? (
        <section className="bg-sun-50 py-16 sm:py-20">
          <div className="container-page">
            <SectionHead title="Bonnes affaires" text="Produits en promotion, dans la limite des stocks." href="/produits?promo=1" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
              {sales.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="py-16 sm:py-20">
        <div className="container-page">
          <SectionHead
            title="Ceux qui font les produits"
            text="Coopératives, artisans et PME vérifiés par notre équipe."
            href="/producteurs"
            linkLabel="Tous les producteurs"
          />
          <ProducerRail producers={producers.slice(0, 6)} />
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="container-page">
          <SectionHead title="Comment ça marche" />
          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-900 font-display text-xl font-extrabold text-sun-400">
                  {i + 1}
                </span>
                {i < STEPS.length - 1 ? (
                  <span aria-hidden className="absolute left-14 right-0 top-6 hidden border-t-2 border-dashed border-brand-200 lg:block" />
                ) : null}
                <h3 className="mt-4 font-display text-xl font-bold text-brand-950">{s.title}</h3>
                <p className="mt-1 max-w-xs text-sm leading-relaxed text-earth-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="newsletter" className="bg-sun-400 py-16 sm:py-20">
        <div className="container-page grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-extrabold text-brand-950 sm:text-4xl">
              Les nouvelles récoltes dans votre boîte mail
            </h2>
            <p className="mt-3 max-w-md text-brand-900">
              Une fois par mois : nouveautés, histoires de producteurs et offres réservées aux abonnés. Désinscription
              en un clic.
            </p>
          </div>
          <NewsletterForm source="homepage" />
        </div>
      </section>
    </>
  );
}
