import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalNoticePage() {
  return (
    <div className="container-page py-10">
      <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-earth-500">
        <Link href="/" className="hover:text-brand-700">Accueil</Link> /{" "}
        <span className="text-earth-800">Mentions légales</span>
      </nav>
      <article className="max-w-3xl space-y-6 text-sm leading-relaxed text-earth-700">
        <h1 className="text-3xl font-bold text-earth-900">Mentions légales</h1>
        <p className="text-xs text-earth-500">Contenu de démonstration pour le projet AFRIKA MARKET.</p>

        <dl className="divide-y divide-earth-100 rounded-2xl border border-earth-200 bg-white px-5">
          {[
            ["Éditeur", "AFRIKA MARKET — plateforme e-commerce de produits locaux ouest-africains"],
            ["Siège social", "Abidjan, Côte d'Ivoire"],
            ["Contact", "contact@afrikamarket.ci · +225 07 00 00 00 00"],
            ["Devise", "XOF — Franc CFA BCEAO"],
            ["Hébergement", "Vercel (front-end) et base de données PostgreSQL managée"],
            ["Directeur de la publication", "Direction AFRIKA MARKET"],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6">
              <dt className="w-48 shrink-0 font-semibold text-earth-900">{k}</dt>
              <dd className="text-earth-700">{v}</dd>
            </div>
          ))}
        </dl>
      </article>
    </div>
  );
}
