import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, MapPin, Sprout, Truck } from "lucide-react";
import { getApprovedProducers } from "@/lib/services/producer.service";

export const metadata: Metadata = {
  title: "Notre mission",
  description:
    "Origine, traçabilité et mise en valeur des producteurs : la mission d'AFRIKA MARKET pour le commerce local ouest-africain.",
};

export default async function MissionPage() {
  const producers = await getApprovedProducers();
  const regions = Array.from(new Set(producers.map((p) => p.region))).sort();

  return (
    <div className="container-page py-10">
      <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-earth-500">
        <Link href="/" className="hover:text-brand-700">Accueil</Link> / <span className="text-earth-800">Notre mission</span>
      </nav>

      <h1 className="text-3xl font-bold text-earth-900">Valoriser le savoir-faire ouest-africain</h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-earth-700">
        AFRIKA MARKET n&apos;est pas qu&apos;une boutique en ligne : c&apos;est une <strong>vitrine numérique du
        savoir-faire ouest-africain</strong>. Notre objectif est que le client comprenne ce qu&apos;il achète, d&apos;où
        vient le produit, qui le fabrique, dans quelle région, comment il est produit et comment il sera livré.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-4">
        {[
          { icon: Sprout, title: "Ce qu'il y a dans l'assiette", text: "Cacao, café, cajou, miel, riz, épices, produits à base de coco." },
          { icon: MapPin, title: "D'où ça vient", text: "Région, ville et zone de production affichées sur chaque fiche." },
          { icon: BadgeCheck, title: "Qui le fabrique", text: "Coopératives, ateliers et PME vérifiés, avec leur histoire." },
          { icon: Truck, title: "Comment il arrive", text: "Livraison par zones, suivi de commande et paiement adapté." },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-earth-200 bg-white p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
              <c.icon className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-3 font-bold text-earth-900">{c.title}</h2>
            <p className="mt-1 text-sm text-earth-600">{c.text}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-earth-900">Une architecture multi-pays</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-earth-700">
          Le lancement se fait en Côte d&apos;Ivoire, avec une architecture conçue pour une extension progressive vers
          l&apos;ensemble de la zone UEMOA : chaque pays possède ses propres catégories de livraison, ses zones
          tarifées et ses moyens de paiement.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {regions.map((r) => (
            <li key={r} className="chip">
              <MapPin className="h-3 w-3" aria-hidden /> {r}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-3xl bg-forest-800 p-8 text-white">
        <h2 className="text-2xl font-bold">Ce que nous refusons</h2>
        <ul className="mt-4 grid gap-2 text-sm text-white/85 sm:grid-cols-2">
          <li>• Les produits sans origine identifiable.</li>
          <li>• Les producteurs non validés publiant librement.</li>
          <li>• Les prix modifiables côté client.</li>
          <li>• Les stocks décrémentés sans vérification transactionnelle.</li>
        </ul>
        <p className="mt-6">
          <Link href="/producteurs" className="btn btn-md bg-white text-forest-800 hover:bg-forest-50">
            Découvrir nos {producers.length} producteurs
          </Link>
        </p>
      </section>
    </div>
  );
}
