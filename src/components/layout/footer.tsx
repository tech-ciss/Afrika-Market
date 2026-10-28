import Link from "next/link";

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
    <footer className="mt-20 bg-brand-950 text-white">
      <div className="container-page grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
              <rect x="15" y="1.5" width="19.8" height="19.8" rx="3" transform="rotate(45 15 1.5)" className="fill-white" />
              <rect x="15" y="9" width="8.5" height="8.5" rx="1.5" transform="rotate(45 15 9)" className="fill-sun-400" />
            </svg>
            <span className="font-display text-xl font-extrabold tracking-tight">Afrika Market</span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/75">
            La marketplace qui rapproche l&apos;Afrique de ses consommateurs. Produits locaux, artisanaux et culturels
            d&apos;Afrique de l&apos;Ouest, avec leur origine, leur producteur et leur histoire.
          </p>
          <p className="mt-5 text-sm text-white/75">
            Abidjan, Côte d&apos;Ivoire
            <br />
            <a href="mailto:contact@afrikamarket.ci" className="underline-offset-4 hover:underline">
              contact@afrikamarket.ci
            </a>
          </p>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-sm font-semibold text-white">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/70 transition hover:text-white hover:underline underline-offset-4">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col justify-between gap-2 py-5 text-xs text-white/60 sm:flex-row">
          <p>© {year} Afrika Market. Tous droits réservés.</p>
          <p>Prix en FCFA (XOF). Livraison en Côte d&apos;Ivoire.</p>
        </div>
      </div>
    </footer>
  );
}
