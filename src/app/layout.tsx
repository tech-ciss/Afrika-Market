import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getCart } from "@/lib/services/cart.service";
import { getCurrentUser } from "@/lib/auth/guards";
import { getCategories } from "@/lib/services/catalog.service";

const fontHeading = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-heading", display: "swap" });
const fontBody = Instrument_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

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
  themeColor: "#12152e",
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
    <html lang="fr" className={`${fontHeading.variable} ${fontBody.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-800 focus:shadow-card"
        >
          Aller au contenu
        </a>
        <Header
          user={user ? { name: user.name ?? "", role: user.role } : null}
          cartCount={cartLines.reduce((sum, l) => sum + l.quantity, 0)}
          categories={categories.map((c) => ({ name: c.name, slug: c.slug, children: c.children }))}
        />
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
