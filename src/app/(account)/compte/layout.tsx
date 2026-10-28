import type { Metadata } from "next";
import Link from "next/link";
import { Heart, MapPin, Package, Settings, User as UserIcon } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Mon compte" };

const NAV = [
  { href: "/compte", label: "Mon profil", icon: UserIcon },
  { href: "/compte/commandes", label: "Mes commandes", icon: Package },
  { href: "/compte/adresses", label: "Mes adresses", icon: MapPin },
  { href: "/compte/wishlist", label: "Ma liste d'envies", icon: Heart },
  { href: "/compte/preferences", label: "Préférences", icon: Settings },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="container-page py-8">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-40 lg:h-fit">
          <div className="rounded-2xl border border-earth-200 bg-white p-4">
            <p className="text-sm font-bold text-earth-900">
              {user.name ?? "Mon compte"}
            </p>
            <p className="mt-0.5 truncate text-xs text-earth-500">{user.email}</p>
            <nav className="mt-4 flex flex-wrap gap-1 lg:flex-col" aria-label="Navigation du compte">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-earth-700 hover:bg-brand-50 hover:text-brand-700"
                >
                  <item.icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
