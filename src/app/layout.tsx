import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getCart } from "@/lib/services/cart.service";
import { getCurrentUser } from "@/lib/auth/guards";
import { getCategories } from "@/lib/services/catalog.service";

// Polices auto-hébergées par Next au build : aucune requête vers Google côté visiteur,
// compatible avec la CSP « font-src 'self' ».
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = Figtree({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "AFRIKA MARKET — Produits locaux et artisanaux d'Afrique de l'Ouest",
    template: "%s · AFRIKA MARKET",
  },
  description:
    "AFRIKA MARKET est une plateforme e-commerce ouest-africaine dédiée à la découverte et à la commercialisation de produits locaux, artisanaux et culturels : cacao, karité, épices, artisanat, avec paiement en FCFA et livraison par zones.",
  keywords: [
    "e-commerce Côte d'Ivoire",
    "produits locaux",
    "artisanat Afrique de l'Ouest",
    "beurre de karité",
    "noix de cajou",
    "chocolat ivoirien",
    "FCFA",
  ],
  openGraph: {
    type: "website",
    locale: "fr_CI",
    siteName: "AFRIKA MARKET",
    title: "AFRIKA MARKET — La marketplace qui rapproche l'Afrique de ses consommateurs",
    description: "Découvrez et achetez des produits locaux ouest-africains, avec leur origine et leur producteur.",
  },
};

export const viewport: Viewport = {
  themeColor: "#25357d",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const [cartLines, categories] = await Promise.all([
    user ? getCart(user.id) : Promise.resolve([]),
    getCategories(),
  ]);

  return (
    <html lang="fr" className={`${display.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col">
        {/* Lien d'évitement : au clavier, premier Tab = accès direct au contenu sans repasser par tout le menu. */}
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand-900 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Aller au contenu
        </a>
        <Header
          user={user ? { name: user.name ?? "", role: user.role } : null}
          cartCount={cartLines.reduce((sum, l) => sum + l.quantity, 0)}
          categories={categories.map((c) => ({ name: c.name, slug: c.slug, children: c.children }))}
        />
        <main id="contenu" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
