import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  FolderTree,
  Inbox,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
  Users,
} from "lucide-react";
import { requireRole } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Back-office" };

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/commandes", label: "Commandes", icon: ShoppingCart },
  { href: "/admin/produits", label: "Produits", icon: Package },
  { href: "/admin/producteurs", label: "Producteurs", icon: BadgeCheck },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/admin/catalogue", label: "Catégories", icon: FolderTree },
  { href: "/admin/avis", label: "Avis", icon: MessageSquare },
  { href: "/admin/promotions", label: "Promotions", icon: Tags },
  { href: "/admin/zones", label: "Livraison", icon: Truck },
  { href: "/admin/newsletter", label: "Newsletter", icon: Megaphone },
  { href: "/admin/messages", label: "Messages", icon: Inbox },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">Back-office AFRIKA MARKET</h1>
          <p className="mt-1 text-sm text-earth-600">
            Connecté comme {user.name ?? user.email} · rôle {user.role}
          </p>
        </div>
        <Link href="/" className="btn-secondary btn-md">
          Voir le site
        </Link>
      </div>

      <nav className="mb-6 flex flex-wrap gap-1.5 rounded-2xl border border-earth-200 bg-white p-2" aria-label="Navigation admin">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-earth-700 hover:bg-brand-50 hover:text-brand-700"
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
