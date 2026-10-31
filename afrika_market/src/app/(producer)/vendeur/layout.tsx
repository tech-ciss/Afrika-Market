import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ExternalLink, MapPin, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { getProducerByUserId } from "@/lib/services/producer.service";
import { getStockAlerts } from "@/lib/services/stock.service";
import { PRODUCER_STATUS_LABELS, type ProducerStatus } from "@/lib/validations/enums";
import { DashboardNav, type DashboardNavItem } from "@/components/layout/dashboard-nav";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/surfaces";
import { PLACEHOLDER_IMAGE } from "@/lib/images";

export const metadata: Metadata = { title: "Espace vendeur" };

export default async function ProducerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("PRODUCER", "ADMIN", "SUPER_ADMIN");
  const producer = await getProducerByUserId(user.id);
  const alerts = producer ? await getStockAlerts(producer.id) : [];

  const items: DashboardNavItem[] = [
    { href: "/vendeur", label: "Tableau de bord", icon: "dashboard" },
    { href: "/vendeur/produits", label: "Mes produits", icon: "products", badge: alerts.length || undefined },
    { href: "/vendeur/commandes", label: "Commandes", icon: "orders" },
    { href: "/vendeur/profil", label: "Ma fiche", icon: "profile" },
  ];

  return (
    <div className="container-page py-6 lg:py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_1fr] lg:gap-8">
        <aside className="min-w-0 lg:sticky lg:top-28 lg:h-fit">
          <div className="flex items-center gap-3 rounded-2xl border border-earth-200 bg-white p-4">
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-brand-100">
              <SmartImage src={producer?.logoUrl || PLACEHOLDER_IMAGE} alt="" fill sizes="48px" className="object-cover" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold leading-tight text-brand-950">
                {producer?.name ?? "Compte producteur"}
              </p>
              {producer ? (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-earth-500">
                  <MapPin className="h-3 w-3 shrink-0 text-forest-600" aria-hidden />
                  <span className="truncate">{producer.city}</span>
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 lg:mt-4">
            <DashboardNav items={items} label="Navigation vendeur" rootHref="/vendeur" />
          </div>

          <div className="mt-4 hidden space-y-2 lg:block">
            <Link href="/vendeur/produits/nouveau" className="btn-sun btn-md w-full">
              <Plus className="h-4 w-4" aria-hidden /> Ajouter un produit
            </Link>
            {producer?.status === "APPROVED" ? (
              <Link
                href={`/producteurs/${producer.slug}`}
                className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-brand-700 hover:underline"
              >
                Voir ma page publique <ExternalLink className="h-3 w-3" aria-hidden />
              </Link>
            ) : null}
          </div>
        </aside>

        <div className="min-w-0">
          {producer && producer.status !== "APPROVED" ? (
            <div className="mb-6 rounded-xl border border-sun-300 bg-sun-50 px-4 py-3 text-sm text-brand-950">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 text-sun-700" aria-hidden /> Compte en attente de validation{" "}
                <Badge tone="warning">{PRODUCER_STATUS_LABELS[producer.status as ProducerStatus]}</Badge>
              </p>
              <p className="mt-1 text-earth-700">
                Votre fiche et vos produits seront publiés après validation par l&apos;équipe AFRIKA MARKET. Vous pouvez
                préparer votre catalogue en attendant.
              </p>
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
