import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, LayoutDashboard, Package, ShoppingBag, Store } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { getProducerByUserId } from "@/lib/services/producer.service";
import { getStockAlerts } from "@/lib/services/stock.service";

export const metadata: Metadata = { title: "Espace vendeur" };

export default async function ProducerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("PRODUCER", "ADMIN", "SUPER_ADMIN");
  const producer = await getProducerByUserId(user.id);
  const alerts = producer ? await getStockAlerts(producer.id) : [];

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-earth-900">
            <Store className="h-6 w-6 text-brand-600" aria-hidden /> Espace vendeur
          </h1>
          <p className="mt-1 text-sm text-earth-600">{producer?.name ?? "Compte producteur"}</p>
        </div>
        <Link href="/vendeur/produits/nouveau" className="btn-primary btn-md">
          Ajouter un produit
        </Link>
      </div>

      {producer && producer.status !== "APPROVED" ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" /> Compte en attente de validation
          </p>
          <p className="mt-1">
            Votre fiche producteur sera publiée après validation administrative (statut : {producer.status}).
          </p>
        </div>
      ) : null}

      {alerts.length > 0 ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" /> {alerts.length} produit(s) en rupture ou sous le seuil d&apos;alerte
          </p>
        </div>
      ) : null}

      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Navigation vendeur">
        {[
          { href: "/vendeur", label: "Tableau de bord", icon: LayoutDashboard },
          { href: "/vendeur/produits", label: "Mes produits", icon: Package },
          { href: "/vendeur/commandes", label: "Commandes", icon: ShoppingBag },
          { href: "/vendeur/profil", label: "Ma fiche", icon: Store },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="btn-secondary btn-md inline-flex items-center gap-2 text-sm"
          >
            <item.icon className="h-4 w-4" aria-hidden />
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
