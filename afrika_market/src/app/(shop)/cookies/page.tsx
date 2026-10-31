import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Politique de cookies" };

export default function CookiesPage() {
  return (
    <div className="container-page py-10">
      <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-earth-500">
        <Link href="/" className="hover:text-brand-700">Accueil</Link> /{" "}
        <span className="text-earth-800">Politique de cookies</span>
      </nav>
      <article className="max-w-3xl space-y-6 text-sm leading-relaxed text-earth-700">
        <h1 className="text-3xl font-bold text-earth-900">Politique de cookies</h1>

        <section>
          <h2 className="text-lg font-bold text-earth-900">Cookies strictement nécessaires</h2>
          <p>
            Ils servent à maintenir votre session connectée, à mémoriser votre panier invité dans votre navigateur et
            à sécuriser les formulaires. Ils ne peuvent pas être désactivés.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-earth-900">Cookies de mesure d&apos;audience</h2>
          <p>
            Lorsqu&apos;ils sont activés, ils permettent de mesurer la fréquentation de la boutique afin d&apos;améliorer
            le catalogue et le parcours d&apos;achat.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-earth-900">Gestion</h2>
          <p>
            Vous pouvez à tout moment supprimer le panier invité depuis votre navigateur ; celui-ci est stocké
            localement sous la clé <code className="rounded bg-earth-100 px-1">afrika-market-cart</code>.
          </p>
        </section>
      </article>
    </div>
  );
}
