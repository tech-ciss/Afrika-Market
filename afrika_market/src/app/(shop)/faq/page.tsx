import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Questions fréquentes : commandes, livraison, paiement, retours et devenir producteur sur AFRIKA MARKET.",
};

const FAQ = [
  {
    q: "Comment se passe la livraison ?",
    a: "Chaque commande est livrée selon la zone choisie : Abidjan en 24 h, les grandes villes de l'intérieur en 48 à 72 h. Les frais dépendent de la zone et du montant de la commande ; la livraison devient gratuite au-delà d'un seuil défini par zone (par exemple 50 000 FCFA à Abidjan).",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Wave, Orange Money, MTN Mobile Money, Moov Money, la carte bancaire, et le paiement à la livraison dans les zones où il est autorisé (principalement Abidjan).",
  },
  {
    q: "Puis-je commander sans créer de compte ?",
    a: "Oui. Le checkout invité est disponible : renseignez simplement votre e-mail et votre téléphone pour recevoir la confirmation et suivre votre commande.",
  },
  {
    q: "Comment savoir d'où vient un produit ?",
    a: "Chaque fiche produit affiche le pays, la région, la ville ou zone de production, le producteur, la méthode de production et, lorsqu'elle est connue, la période de récolte.",
  },
  {
    q: "Puis-je laisser un avis sur un produit ?",
    a: "Uniquement si vous l'avez acheté. L'avis est ensuite modéré par notre équipe avant publication ; la note moyenne du produit est recalculée automatiquement.",
  },
  {
    q: "Que faire si un produit est en rupture ?",
    a: "Le stock affiché est celui du producteur, mis à jour en temps réel. Lorsqu'un produit est épuisé, la fiche l'indique et le bouton d'achat est désactivé.",
  },
  {
    q: "Comment devenir producteur sur la plateforme ?",
    a: "Créez un compte depuis la page d'inscription en choisissant « Devenir producteur », complétez votre fiche, puis publiez vos produits. L'équipe valide votre compte sous 72 h en moyenne.",
  },
  {
    q: "Comment fonctionnent les codes promotionnels ?",
    a: "Les codes sont vérifiés côté serveur : date de validité, montant minimum, nombre d'utilisations et produits éligibles. Exemples : BIENVENUE10 (−10 %), LIVRAISON0 (livraison offerte), AFRIKA20 (−20 % dès 25 000 FCFA).",
  },
  {
    q: "Puis-je annuler ou faire rembourser une commande ?",
    a: "Une commande peut être annulée tant qu'elle n'est pas livrée ; le stock est automatiquement restitué. Les remboursements sont traités par notre équipe après vérification du paiement.",
  },
];

export default function FaqPage() {
  return (
    <div className="container-page py-10">
      <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-earth-500">
        <Link href="/" className="hover:text-brand-700">Accueil</Link> / <span className="text-earth-800">FAQ</span>
      </nav>

      <h1 className="text-3xl font-bold text-earth-900">Questions fréquentes</h1>
      <p className="mt-2 max-w-2xl text-sm text-earth-600">
        Commandes, livraison, paiement, retours et vente en tant que producteur.
      </p>

      <div className="mt-8 max-w-3xl space-y-3">
        {FAQ.map((item) => (
          <details key={item.q} className="group rounded-2xl border border-earth-200 bg-white p-5 open:border-brand-300">
            <summary className="cursor-pointer list-none text-base font-semibold text-earth-900 marker:hidden">
              <span className="flex items-center justify-between gap-4">
                {item.q}
                <span className="text-brand-600 transition group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-earth-700">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-50 p-6">
        <h2 className="text-lg font-bold text-earth-900">Une autre question ?</h2>
        <p className="mt-1 text-sm text-earth-600">Notre équipe répond sous 48 h ouvrées.</p>
        <Link href="/contact" className="btn-primary btn-md mt-4">Nous contacter</Link>
      </div>
    </div>
  );
}
