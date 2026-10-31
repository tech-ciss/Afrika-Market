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
    <footer className="on-dark mt-0 bg-brand-950 text-white">
      <div className="weave" aria-hidden />
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-3">
            <span className="arch flex h-10 w-9 items-end justify-center bg-sun-400 pb-2 text-brand-950">
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                <path d="M7 0 L14 7 L7 14 L0 7 Z" fill="currentColor" />
              </svg>
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight text-white">AFRIKA MARKET</span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
            La marketplace qui rapproche l&apos;Afrique de ses consommateurs. Produits locaux, artisanaux et culturels
            d&apos;Afrique de l&apos;Ouest, avec leur origine, leur producteur et leur histoire.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sun-400" aria-hidden /> Abidjan, Côte d&apos;Ivoire
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-sun-400" aria-hidden /> +225 07 00 00 00 00
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-sun-400" aria-hidden /> contact@afrikamarket.ci
            </li>
          </ul>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="font-sans text-sm font-semibold tracking-normal text-sun-300">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/75 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-5 text-xs text-white/60 sm:flex-row">
          <p>© {year} AFRIKA MARKET. Tous droits réservés. Prix en FCFA (XOF).</p>
          <div className="flex items-center gap-1">
            <a href="#" aria-label="Facebook" className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-sun-300">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Instagram" className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-sun-300">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Twitter" className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-sun-300">
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
