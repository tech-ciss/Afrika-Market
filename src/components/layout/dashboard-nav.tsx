"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  FolderTree,
  Inbox,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tags,
  Truck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Les icônes sont des fonctions : elles ne peuvent pas passer d'un composant serveur à un composant client.
// Le serveur envoie donc un nom, résolu ici.
const ICONS = {
  dashboard: LayoutDashboard,
  products: Package,
  orders: ShoppingBag,
  cart: ShoppingCart,
  profile: Store,
  producers: BadgeCheck,
  users: Users,
  categories: FolderTree,
  reviews: MessageSquare,
  promotions: Tags,
  delivery: Truck,
  newsletter: Megaphone,
  messages: Inbox,
  settings: Settings,
} as const;

export type NavIcon = keyof typeof ICONS;

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: NavIcon;
  /** Pastille de compteur (ex. produits en alerte, avis à modérer). */
  badge?: number;
  /** Titre de section affiché au-dessus de l'entrée (ordinateur uniquement), quand la section change. */
  section?: string;
}

/**
 * Navigation latérale (ordinateur) / défilante (mobile) des espaces vendeur et admin.
 * L'entrée racine n'est active que sur sa propre page ; les autres le sont aussi sur leurs sous-pages.
 */
export function DashboardNav({
  items,
  label,
  rootHref,
  tone = "light",
}: {
  items: DashboardNavItem[];
  label: string;
  rootHref: string;
  /** « dark » : à poser sur un fond indigo (back-office). */
  tone?: "light" | "dark";
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={label}
      className={cn(
        "no-scrollbar flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible",
        tone === "light" && "-mx-4 px-4 pb-1 lg:mx-0 lg:px-0 lg:pb-0",
      )}
    >
      {items.map((item, index) => {
        const Icon = ICONS[item.icon];
        const active = item.href === rootHref ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const newSection = item.section && item.section !== items[index - 1]?.section;
        return (
          <div key={item.href} className="contents">
            {newSection ? (
              <p
                className={cn(
                  "mb-1 hidden px-3.5 text-xs font-semibold lg:block",
                  index === 0 ? "mt-0" : "mt-5",
                  tone === "dark" ? "text-white/60" : "text-earth-500",
                )}
              >
                {item.section}
              </p>
            ) : null}
          <Link
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              tone === "light" &&
                (active ? "bg-brand-800 text-white" : "text-earth-700 hover:bg-brand-50 hover:text-brand-800"),
              tone === "dark" &&
                (active ? "bg-sun-400 text-brand-950" : "text-white/75 hover:bg-white/10 hover:text-white"),
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                tone === "light" ? (active ? "text-sun-400" : "text-earth-500") : active ? "text-brand-950" : "text-white/60",
              )}
              aria-hidden
            />
            <span className="whitespace-nowrap">{item.label}</span>
            {item.badge ? (
              <span
                className={cn(
                  "ml-auto rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none",
                  active ? (tone === "dark" ? "bg-brand-950 text-sun-300" : "bg-sun-400 text-brand-950") : "bg-kola-500 text-white",
                )}
                aria-label={`${item.badge} à traiter`}
              >
                {item.badge}
              </span>
            ) : null}
          </Link>
          </div>
        );
      })}
    </nav>
  );
}
