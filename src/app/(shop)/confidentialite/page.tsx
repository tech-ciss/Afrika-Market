import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <div className="container-page py-10">
      <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-earth-500">
        <Link href="/" className="hover:text-brand-700">Accueil</Link> /{" "}
        <span className="text-earth-800">Politique de confidentialité</span>
      </nav>
      <article className="max-w-3xl space-y-6 text-sm leading-relaxed text-earth-700">
        <h1 className="text-3xl font-bold text-earth-900">Politique de confidentialité</h1>
        <p className="text-xs text-earth-500">Document de démonstration — à valider par un conseil juridique.</p>

        <section>
          <h2 className="text-lg font-bold text-earth-900">1. Données collectées</h2>
          <p>
            Nous collectons les données nécessaires au traitement des commandes : identité, e-mail, numéro de
            téléphone, adresses de livraison, historique des commandes et avis publiés. Les moyens de paiement sont
            traités par nos prestataires : AFRIKA MARKET ne stocke jamais de numéro de carte.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-earth-900">2. Finalités</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Traitement et livraison des commandes ;</li>
            <li>Gestion du compte client et du suivi de livraison ;</li>
            <li>Modération des avis et lutte contre la fraude ;</li>
            <li>Envoi de la newsletter, uniquement avec votre accord.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-earth-900">3. Partage</h2>
          <p>
            Les données sont partagées uniquement avec les producteurs concernés par une commande, les transporteurs
            et nos prestataires techniques. Elles ne sont jamais vendues à des tiers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-earth-900">4. Conservation et sécurité</h2>
          <p>
            Les données sont conservées le temps nécessaire au traitement des commandes et aux obligations légales.
            Les mots de passe sont hachés, les sessions signées, et l&apos;accès aux données est vérifié côté
            serveur pour chaque requête.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-earth-900">5. Vos droits</h2>
          <p>
            Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données depuis votre espace
            client ou en écrivant à contact@afrikamarket.ci.
          </p>
        </section>
      </article>
    </div>
  );
}
