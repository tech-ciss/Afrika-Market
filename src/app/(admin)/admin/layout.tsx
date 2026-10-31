import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { DashboardNav, type DashboardNavItem } from "@/components/layout/dashboard-nav";

export const metadata: Metadata = { title: "Back-office" };

const ROLE_LABELS: Record<string, string> = { ADMIN: "Administrateur", SUPER_ADMIN: "Super-administrateur" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");

  // Pastilles : ce qui attend une décision de l'équipe.
  const [pendingProducers, pendingReviews, unreadMessages] = await Promise.all([
    prisma.producer.count({ where: { status: "PENDING" } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ]);

  const items: DashboardNavItem[] = [
    { href: "/admin", label: "Tableau de bord", icon: "dashboard", section: "Activité" },
    { href: "/admin/commandes", label: "Commandes", icon: "cart", section: "Activité" },
    { href: "/admin/produits", label: "Produits", icon: "products", section: "Activité" },
    { href: "/admin/producteurs", label: "Producteurs", icon: "producers", section: "Activité", badge: pendingProducers || undefined },
    { href: "/admin/catalogue", label: "Catégories", icon: "categories", section: "Contenu" },
    { href: "/admin/promotions", label: "Promotions", icon: "promotions", section: "Contenu" },
    { href: "/admin/avis", label: "Avis", icon: "reviews", section: "Contenu", badge: pendingReviews || undefined },
    { href: "/admin/newsletter", label: "Newsletter", icon: "newsletter", section: "Contenu" },
    { href: "/admin/messages", label: "Messages", icon: "messages", section: "Contenu", badge: unreadMessages || undefined },
    { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "users", section: "Plateforme" },
    { href: "/admin/zones", label: "Livraison", icon: "delivery", section: "Plateforme" },
    { href: "/admin/parametres", label: "Paramètres", icon: "settings", section: "Plateforme" },
  ];

  return (
    <div className="container-page py-6 lg:py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_1fr] lg:gap-8">
        <aside className="min-w-0 lg:sticky lg:top-28 lg:h-fit">
          <div className="on-dark overflow-hidden rounded-2xl bg-brand-950 text-white">
            <div className="weave" aria-hidden />
            <div className="p-4">
              <p className="flex items-center gap-2 font-display text-lg font-extrabold text-white">
                <ShieldCheck className="h-5 w-5 text-sun-400" aria-hidden /> Back-office
              </p>
              <p className="mt-1 truncate text-xs text-white/60">
                {user.name ?? user.email} · {ROLE_LABELS[user.role] ?? user.role}
              </p>
            </div>
            <div className="px-3 pb-3">
              <DashboardNav items={items} label="Navigation administrateur" rootHref="/admin" tone="dark" />
            </div>
            <div className="hidden border-t border-white/10 px-4 py-3 lg:block">
              <Link href="/" className="flex items-center gap-1.5 py-1 text-xs font-semibold text-sun-300 hover:text-sun-200">
                Voir le site <ExternalLink className="h-3 w-3" aria-hidden />
              </Link>
            </div>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
