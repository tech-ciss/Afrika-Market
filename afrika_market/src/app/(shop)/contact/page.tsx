import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/features/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez l'équipe AFRIKA MARKET : service client, devenir producteur, presse et partenariats.",
};

export default function ContactPage() {
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-earth-900">Contactez-nous</h1>
      <p className="mt-2 max-w-2xl text-sm text-earth-600">
        Une question sur une commande, une livraison ou l&apos;accès à la plateforme en tant que producteur ?
        Notre équipe répond sous 48 h ouvrées.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-earth-200 bg-white p-6">
          <ContactForm />
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-earth-200 bg-white p-5">
            <h2 className="text-sm font-bold text-earth-900">Nos coordonnées</h2>
            <ul className="mt-3 space-y-3 text-sm text-earth-600">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-600" aria-hidden /> Abidjan, Côte d&apos;Ivoire
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-600" aria-hidden /> +225 07 00 00 00 00
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-600" aria-hidden /> contact@afrikamarket.ci
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5 text-sm text-earth-700">
            <p className="font-semibold text-earth-900">Vous êtes producteur ?</p>
            <p className="mt-1">
              Créez directement votre espace vendeur depuis la page d&apos;inscription, puis complétez votre fiche.
            </p>
          </div>

          <div className="rounded-2xl border border-earth-200 bg-white p-5 text-sm text-earth-600">
            <p className="font-semibold text-earth-900">Questions fréquentes</p>
            <p className="mt-1">
              Consultez la <a href="/faq" className="font-semibold text-brand-700 underline">FAQ</a> : délais,
              paiement à la livraison, retours et suivi de commande.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
