import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, MapPin, Sprout } from "lucide-react";
import { getApprovedProducers } from "@/lib/services/producer.service";

export const metadata: Metadata = {
  title: "Nos producteurs",
  description:
    "Découvrez les coopératives, artisans et PME partenaires d'AFRIKA MARKET en Côte d'Ivoire : cacao, karité, cajou, café, vannerie et plus encore.",
};

export default async function ProducersPage() {
  const producers = await getApprovedProducers();

  return (
    <div className="container-page py-10">
      <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-earth-500">
        <Link href="/" className="hover:text-brand-700">Accueil</Link> /{" "}
        <Link href="/producteurs" className="hover:text-brand-700">Producteurs</Link>
      </nav>

      <div className="rounded-3xl bg-gradient-to-br from-forest-700 to-forest-900 p-8 text-white sm:p-10">
        <h1 className="text-3xl font-bold sm:text-4xl">Les producteurs derrière chaque produit</h1>
        <p className="mt-3 max-w-2xl text-white/80">
          {producers.length} coopératives, artisans et entreprises vérifiés. Chaque fiche présente leur histoire,
          leur région et leurs spécialités — pour acheter en connaissance de cause.
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {producers.map((p) => (
          <Link
            key={p.id}
            href={`/producteurs/${p.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-earth-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg"
          >
            <div className="relative h-28 bg-gradient-to-r from-brand-500 to-earth-600">
              {p.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.logoUrl} alt="" className="absolute -bottom-8 left-5 h-20 w-20 rounded-2xl border-4 border-white object-cover shadow" loading="lazy" />
              ) : null}
            </div>
            <div className="p-5 pt-12">
              <h2 className="flex items-center gap-1.5 font-semibold text-earth-900 group-hover:text-brand-700">
                {p.name}
                <BadgeCheck className="h-4 w-4 text-forest-600" aria-label="Producteur vérifié" />
              </h2>
              <p className="mt-1 flex items-center gap-1 text-xs text-earth-500">
                <MapPin className="h-3 w-3" /> {p.city}, {p.region} · {p.country.name}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-earth-600">{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.specialties
                  .split(",")
                  .slice(0, 3)
                  .map((s) => (
                    <span key={s} className="rounded-full bg-earth-100 px-2 py-0.5 text-[11px] text-earth-600">
                      {s.trim()}
                    </span>
                  ))}
              </div>
              <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-forest-700">
                <Sprout className="h-3.5 w-3.5" /> {p._count.products} produits en ligne
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-brand-100 bg-brand-50 p-6 text-center">
        <h2 className="text-lg font-bold text-earth-900">Vous produisez en Afrique de l&apos;Ouest ?</h2>
        <p className="mx-auto mt-1 max-w-xl text-sm text-earth-600">
          Rejoignez AFRIKA MARKET : créez votre fiche, présentez vos produits et gérez vos commandes depuis votre
          espace vendeur. Validation par notre équipe sous 72 h.
        </p>
        <Link href="/inscription?intent=producteur" className="btn-primary btn-md mt-4">
          Devenir producteur
        </Link>
      </div>
    </div>
  );
}
