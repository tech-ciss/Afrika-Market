import type { Metadata } from "next";
import Link from "next/link";
import { HeartHandshake, ShieldCheck, Sparkles, Target } from "lucide-react";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "AFRIKA MARKET est une plateforme e-commerce ouest-africaine dédiée à la découverte et à la commercialisation de produits locaux, artisanaux et culturels.",
};

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: "Valoriser le savoir-faire",
      text: "Chaque producteur dispose d'une fiche publique présentant son histoire, sa région et ses spécialités.",
    },
    {
      icon: ShieldCheck,
      title: "Garantir la confiance",
      text: "Producteurs validés, avis modérés, prix et stocks vérifiés côté serveur à chaque commande.",
    },
    {
      icon: HeartHandshake,
      title: "Rémunérer justement",
      text: "Le producteur est payé pour ce qu'il vend, sans intermédiaire opaque ni course au discount.",
    },
    {
      icon: Sparkles,
      title: "Simplifier l'achat local",
      text: "Paiement en FCFA, Mobile Money, paiement à la livraison et livraison par zones : l'e-commerce adapté au marché.",
    },
  ];

  return (
    <div className="container-page py-10">
      <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-earth-500">
        <Link href="/" className="hover:text-brand-700">Accueil</Link> / <span className="text-earth-800">À propos</span>
      </nav>

      <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-earth-800 p-8 text-white sm:p-12">
        <h1 className="text-3xl font-bold sm:text-4xl">La marketplace qui rapproche l&apos;Afrique de ses consommateurs</h1>
        <p className="mt-4 max-w-3xl text-white/85">
          AFRIKA MARKET est une plateforme e-commerce ouest-africaine dédiée à la découverte et à la
          commercialisation de produits locaux, artisanaux et culturels, avec une expérience pensée autour des
          producteurs, des paiements locaux et des réalités logistiques de la région.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {values.map((v) => (
          <div key={v.title} className="rounded-2xl border border-earth-200 bg-white p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <v.icon className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-3 text-lg font-bold text-earth-900">{v.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-earth-600">{v.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-2xl font-bold text-earth-900">Le constat</h2>
          <p className="mt-3 text-sm leading-relaxed text-earth-700">
            De nombreux producteurs, coopératives, artisans et petites entreprises locales disposent de produits de
            qualité, mais rencontrent des difficultés pour les présenter professionnellement, toucher de nouveaux
            clients, gérer leurs commandes et développer leurs ventes en ligne.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-earth-700">
            AFRIKA MARKET répond à ce besoin : un catalogue centralisé, une vitrine pour chaque producteur, un suivi
            des stocks et des commandes, et des moyens de paiement adaptés au marché ouest-africain.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-earth-900">Notre modèle</h2>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed text-earth-700">
            <li>• <strong>Ouverture contrôlée</strong> : chaque producteur est validé avant publication.</li>
            <li>• <strong>Traçabilité</strong> : origine, région, méthode de production et période de récolte affichées.</li>
            <li>• <strong>Livraison par zones</strong> : tarification claire, du centre-ville aux villes de l&apos;intérieur.</li>
            <li>• <strong>Paiements locaux</strong> : Wave, Orange Money, MTN, Moov, carte et paiement à la livraison.</li>
          </ul>
        </section>
      </div>

      <div className="mt-10 rounded-2xl border border-brand-100 bg-brand-50 p-6 text-center">
        <h2 className="text-lg font-bold text-earth-900">Envie de rejoindre l&apos;aventure ?</h2>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link href="/produits" className="btn-primary btn-md">Découvrir la boutique</Link>
          <Link href="/inscription?intent=producteur" className="btn-secondary btn-md">Devenir producteur</Link>
        </div>
      </div>
    </div>
  );
}
