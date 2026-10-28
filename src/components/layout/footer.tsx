import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();
  const columns = [
    {
      title: "Boutique",
      links: [
        { label: "Tous les produits", href: "/produits" },
        { label: "Catégories", href: "/categories" },
        { label: "Producteurs", href: "/producteurs" },
        { label: "Nouveautés", href: "/produits?tri=newest" },
        { label: "Promotions", href: "/produits?tri=prix-croissant&promo=1" },
        { label: "Coffrets cadeaux", href: "/categories/coffrets-cadeaux" },
      ],
    },
    {
      title: "La plateforme",
      links: [
        { label: "À propos", href: "/a-propos" },
        { label: "Notre mission", href: "/mission" },
        { label: "Devenir producteur", href: "/inscription?intent=producteur" },
        { label: "FAQ", href: "/faq" },
        { label: "Contact", href: "/contact" },
        { label: "Newsletter", href: "/#newsletter" },
      ],
    },
    {
      title: "Informations légales",
      links: [
        { label: "Conditions générales de vente", href: "/cgv" },
        { label: "Politique de confidentialité", href: "/confidentialite" },
        { label: "Politique de cookies", href: "/cookies" },
        { label: "Mentions légales", href: "/mentions-legales" },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t border-earth-200 bg-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg font-black text-white">
              A
            </span>
            <span className="text-lg font-extrabold tracking-tight text-earth-900">
              AFRIKA <span className="text-brand-600">MARKET</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-earth-600">
            La marketplace qui rapproche l&apos;Afrique de ses consommateurs. Produits locaux, artisanaux et
            culturels d&apos;Afrique de l&apos;Ouest, avec leur origine, leur producteur et leur histoire.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-earth-600">
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

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-earth-900">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-earth-600 transition hover:text-brand-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-earth-100">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-5 text-xs text-earth-500 sm:flex-row">
          <p>© {year} AFRIKA MARKET — Tous droits réservés. Prix en FCFA (XOF).</p>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="Facebook" className="hover:text-brand-700">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Instagram" className="hover:text-brand-700">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Twitter" className="hover:text-brand-700">
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
