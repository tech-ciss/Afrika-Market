import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Conditions générales de vente" };

export default function CgvPage() {
  return (
    <div className="container-page py-10">
      <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-earth-500">
        <Link href="/" className="hover:text-brand-700">Accueil</Link> /{" "}
        <span className="text-earth-800">Conditions générales de vente</span>
      </nav>
      <article className="prose-sm max-w-3xl space-y-6 text-sm leading-relaxed text-earth-700">
        <h1 className="text-3xl font-bold text-earth-900">Conditions générales de vente</h1>
        <p className="text-xs text-earth-500">Dernière mise à jour : 27 octobre 2026 — document de démonstration.</p>

        <section>
          <h2 className="text-lg font-bold text-earth-900">1. Objet</h2>
          <p>
            Les présentes conditions régissent les ventes conclues sur la plateforme AFRIKA MARKET entre des
            consommateurs et des producteurs, artisans ou coopératives référencés, le tout pour la Côte d&apos;Ivoire
            et la zone UEMOA, en devise XOF (franc CFA BCEAO).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-earth-900">2. Prix</h2>
          <p>
            Les prix sont indiqués en FCFA, toutes taxes comprises lorsque applicable. Le prix applicable est celui
            affiché au moment de la validation de la commande ; les montants sont recalculés et vérifiés par nos
            serveurs avant toute débitation, et le prix du client n&apos;est jamais déterminé par les valeurs
            transmises par son navigateur.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-earth-900">3. Commande et paiement</h2>
          <p>
            La commande est ferme après validation du paiement ou, pour le paiement à la livraison, après
            confirmation. Les moyens de paiement acceptés sont le Wave, l&apos;Orange Money, le MTN Mobile Money, le
            Moov Money, la carte bancaire et, dans les zones autorisées, le paiement à la livraison.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-earth-900">4. Livraison</h2>
          <p>
            Les livraisons sont assurées par zones. Les délais indicatifs sont de 24 h pour Abidjan et de 48 à 72 h
            pour les autres villes desservies. Les frais et seuils de gratuité sont consultables au moment du
            checkout selon la zone sélectionnée.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-earth-900">5. Droit de rétractation et retours</h2>
          <p>
            Compte tenu de la nature alimentaire ou artisanale de nombreux produits, le droit de rétractation ne
            s&apos;applique pas aux denrées périssables. Toute réclamation relative à un produit endommagé ou non
            conforme doit être signalée sous 48 h après réception, avec photographies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-earth-900">6. Annulation et remboursement</h2>
          <p>
            Une commande peut être annulée tant qu&apos;elle n&apos;a pas été expédiée ; le stock est restitué
            automatiquement. Les remboursements sont effectués par le moyen de paiement utilisé lorsqu&apos;il le
            permet.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-earth-900">7. Responsabilité</h2>
          <p>
            AFRIKA MARKET intervient en qualité d&apos;intermédiaire technique : le vendeur reste responsable de la
            qualité, de la conformité et de l&apos;origine déclarée de ses produits.
          </p>
        </section>
      </article>
    </div>
  );
}
