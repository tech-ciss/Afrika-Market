"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Search, ShoppingBasket, User, X, LogOut, LayoutDashboard, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGuestCart, guestCartCount } from "@/lib/store/guest-cart";
import { syncGuestCartAction } from "@/actions/cart";
import { logoutAction } from "@/actions/auth";

type CategoryLink = { name: string; slug: string; children: CategoryLink[] };

export function Header({
  user,
  cartCount,
  categories,
}: {
  user: { name: string; role: "CLIENT" | "PRODUCER" | "ADMIN" | "SUPER_ADMIN" } | null;
  cartCount: number;
  categories: CategoryLink[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [q, setQ] = useState("");
  const lines = useGuestCart((s) => s.lines);
  const clear = useGuestCart((s) => s.clear);
  const [serverCount, setServerCount] = useState(cartCount);
  const [synced, setSynced] = useState(false);
  const [bump, setBump] = useState(false);
  const previousCount = useRef<number | null>(null);

  useEffect(() => setServerCount(cartCount), [cartCount]);

  // Fusion du panier local dans le panier du compte juste après connexion (§10).
  useEffect(() => {
    if (!user || synced || lines.length === 0) return;
    setSynced(true);
    syncGuestCartAction(
      lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
    )
      .then((res) => {
        if (res.ok) clear();
      })
      .catch(() => undefined);
  }, [user, lines, clear, synced]);

  useEffect(() => {
    setMobileOpen(false);
    setCatsOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  const count = user ? serverCount : guestCartCount(lines);

  // Clavier : Échap referme les menus ouverts (compte, catégories, menu mobile).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setAccountOpen(false);
      setCatsOpen(false);
      setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Le compteur « rebondit » quand un article est ajouté : retour visuel immédiat de l'action.
  useEffect(() => {
    if (previousCount.current !== null && count > previousCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 500);
      previousCount.current = count;
      return () => clearTimeout(t);
    }
    previousCount.current = count;
  }, [count]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push(`/produits${params.toString() ? `?${params}` : ""}`);
  }

  const dashHref = user?.role === "PRODUCER" ? "/vendeur" : user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" ? "/admin" : "/compte";

  return (
    <header className="sticky top-0 z-40 border-b border-earth-200 bg-white/90 backdrop-blur-md">
      <div className="on-dark bg-brand-950 text-white">
        <div className="container-page flex h-9 items-center justify-between text-xs">
          <p className="truncate text-white/90">
            Produits d&apos;Afrique de l&apos;Ouest · Paiement en FCFA ·{" "}
            <span className="font-semibold text-sun-300">Livraison offerte dès 50 000 FCFA à Abidjan</span>
          </p>
          <div className="hidden items-center gap-4 sm:flex">
            <Link href="/mission" className="hover:underline">
              Notre mission
            </Link>
            <Link href="/vendeur" className="hover:underline">
              Vendre sur AFRIKA MARKET
            </Link>
          </div>
        </div>
      </div>

      <div className="container-page flex h-16 items-center gap-3 sm:gap-4">
        <button
          type="button"
          className="btn-ghost btn-md -ml-2 lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="arch flex h-10 w-9 items-end justify-center bg-brand-800 pb-2 text-sun-400">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path d="M7 0 L14 7 L7 14 L0 7 Z" fill="currentColor" />
            </svg>
          </span>
          <span className="hidden font-display text-xl font-extrabold tracking-tight text-brand-950 sm:block">
            AFRIKA <span className="text-brand-600">MARKET</span>
          </span>
        </Link>

        <form onSubmit={submitSearch} role="search" className="relative hidden flex-1 md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-500" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher : karité, cajou, chocolat, Korhogo…"
            aria-label="Rechercher un produit"
            className="w-full rounded-full border border-earth-200 bg-earth-50 py-2.5 pl-10 pr-4 text-sm placeholder:text-earth-500 transition-colors focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              className="btn-ghost btn-md hidden sm:inline-flex"
              aria-expanded={accountOpen}
              aria-haspopup="true"
            >
              <User className="h-4 w-4" />
              <span className="max-w-24 truncate">{user ? user.name.split(" ")[0] ?? "Compte" : "Connexion"}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {accountOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 animate-pop-in overflow-hidden rounded-xl border border-earth-200 bg-white py-1 shadow-lift">
                {user ? (
                  <>
                    <Link href="/compte" className="block px-4 py-2.5 text-sm hover:bg-earth-50">
                      Mon compte
                    </Link>
                    <Link href={dashHref} className="block px-4 py-2.5 text-sm hover:bg-earth-50">
                      {user.role === "PRODUCER" ? (
                        <span className="inline-flex items-center gap-2"><Store className="h-4 w-4" /> Espace vendeur</span>
                      ) : user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? (
                        <span className="inline-flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Back-office</span>
                      ) : (
                        "Mes commandes"
                      )}
                    </Link>
                    <form action={logoutAction}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-kola-600 hover:bg-kola-50"
                      >
                        <LogOut className="h-4 w-4" /> Se déconnecter
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/connexion" className="block px-4 py-2.5 text-sm font-medium hover:bg-earth-50">
                      Se connecter
                    </Link>
                    <Link href="/inscription" className="block px-4 py-2.5 text-sm hover:bg-earth-50">
                      Créer un compte
                    </Link>
                    <Link href="/inscription?intent=producteur" className="block px-4 py-2.5 text-sm hover:bg-earth-50">
                      Devenir producteur
                    </Link>
                  </>
                )}
              </div>
            ) : null}
          </div>

          <Link href="/panier" className="btn-ghost btn-md relative" aria-label={`Panier, ${count} article(s)`}>
            <ShoppingBasket className="h-5 w-5" />
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold",
                count > 0 ? "bg-sun-400 text-brand-950" : "bg-earth-200 text-earth-600",
                bump && "animate-bump",
              )}
            >
              {count > 99 ? "99+" : count}
            </span>
          </Link>
        </div>
      </div>

      {/* Navigation catégories (desktop) */}
      <nav className="hidden border-t border-earth-100 lg:block" aria-label="Navigation principale">
        <div className="container-page flex h-11 items-center gap-6 text-sm font-medium text-earth-700">
          <Link href="/produits" className="hover:text-brand-700">
            Boutique
          </Link>
          <div className="relative" onMouseLeave={() => setCatsOpen(false)}>
            <button
              type="button"
              onMouseEnter={() => setCatsOpen(true)}
              onClick={() => setCatsOpen((v) => !v)}
              className="inline-flex items-center gap-1 hover:text-brand-700"
              aria-expanded={catsOpen}
            >
              Catégories <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {catsOpen ? (
              <div className="absolute left-0 top-full z-50 grid w-[34rem] animate-pop-in grid-cols-2 gap-1 rounded-b-2xl border border-earth-200 bg-white p-3 shadow-lift">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/categories/${c.slug}`}
                    className="rounded-lg px-3 py-2 text-sm hover:bg-earth-50 hover:text-brand-700"
                  >
                    {c.name}
                    {c.children.length > 0 ? (
                      <span className="block text-xs text-earth-500">
                        {c.children.map((s) => s.name).join(", ")}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <Link href="/producteurs" className="hover:text-brand-700">
            Producteurs
          </Link>
          <Link href="/produits?tri=newest" className="hover:text-brand-700">
            Nouveautés
          </Link>
          <Link href="/produits?promo=1" className="hover:text-brand-700">
            Promotions
          </Link>
          <Link href="/mission" className="hover:text-brand-700">
            Origine &amp; traçabilité
          </Link>
          <Link href="/faq" className="ml-auto hover:text-brand-700">
            FAQ
          </Link>
        </div>
      </nav>

      {/* Menu mobile */}
      {mobileOpen ? (
        <div className="animate-pop-in border-t border-earth-100 bg-white lg:hidden">
          <form onSubmit={submitSearch} className="border-b border-earth-100 p-3 md:hidden">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-earth-500" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un produit…"
                aria-label="Rechercher un produit"
                className="w-full rounded-full border border-earth-200 bg-earth-50 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </form>
          <nav className="container-page flex flex-col gap-1 py-3" aria-label="Menu mobile">
            <Link href="/produits" className="rounded-lg px-2 py-2.5 hover:bg-earth-50">
              Boutique
            </Link>
            <Link href="/categories" className="rounded-lg px-2 py-2.5 hover:bg-earth-50">
              Catégories
            </Link>
            <Link href="/producteurs" className="rounded-lg px-2 py-2.5 hover:bg-earth-50">
              Producteurs
            </Link>
            <Link href="/produits?promo=1" className="rounded-lg px-2 py-2.5 hover:bg-earth-50">
              Promotions
            </Link>
            <Link href="/mission" className="rounded-lg px-2 py-2.5 hover:bg-earth-50">
              Origine &amp; traçabilité
            </Link>
            <div className="my-2 border-t border-earth-100" />
            {user ? (
              <>
                <Link href="/compte" className="rounded-lg px-2 py-2.5 hover:bg-earth-50">
                  Mon compte
                </Link>
                <Link href={dashHref} className="rounded-lg px-2 py-2.5 hover:bg-earth-50">
                  {user.role === "PRODUCER" ? "Espace vendeur" : user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? "Back-office" : "Mes commandes"}
                </Link>
                <form action={logoutAction}>
                  <button type="submit" className="w-full rounded-lg px-2 py-2.5 text-left text-kola-600 hover:bg-kola-50">
                    Se déconnecter
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/connexion" className="rounded-lg px-2 py-2.5 font-medium hover:bg-earth-50">
                  Se connecter
                </Link>
                <Link href="/inscription" className="rounded-lg px-2 py-2.5 hover:bg-earth-50">
                  Créer un compte
                </Link>
                <Link href="/inscription?intent=producteur" className="rounded-lg px-2 py-2.5 hover:bg-earth-50">
                  Devenir producteur
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
