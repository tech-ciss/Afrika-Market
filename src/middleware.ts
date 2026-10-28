import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Protection centrale des zones privées (cahier §30 : « protection des routes privées »).
 *
 * Défense en profondeur : ce middleware filtre AVANT le rendu, et chaque page
 * continue d'appeler `requireRole()` côté serveur (src/lib/auth/guards.ts).
 * Il ne lit que le JWT (compatible Edge) : aucun accès base de données ici.
 */
type Role = "CLIENT" | "PRODUCER" | "ADMIN" | "SUPER_ADMIN";

const RULES: { prefix: string; roles: Role[] | null }[] = [
  { prefix: "/admin", roles: ["ADMIN", "SUPER_ADMIN"] },
  { prefix: "/vendeur", roles: ["PRODUCER", "ADMIN", "SUPER_ADMIN"] },
  { prefix: "/compte", roles: null }, // tout utilisateur connecté
];

const DASHBOARDS: Record<Role, string> = {
  ADMIN: "/admin",
  SUPER_ADMIN: "/admin",
  PRODUCER: "/vendeur",
  CLIENT: "/compte",
};

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const rule = RULES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  if (!rule) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: req.nextUrl.protocol === "https:",
  });

  // Non connecté → page de connexion, avec retour vers la page demandée.
  if (!token?.id) {
    const url = req.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = `?callbackUrl=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // Connecté mais rôle insuffisant → renvoi vers son propre espace.
  const role = token.role as Role | undefined;
  if (rule.roles && (!role || !rule.roles.includes(role))) {
    const url = req.nextUrl.clone();
    url.pathname = role ? DASHBOARDS[role] : "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/vendeur/:path*", "/compte/:path*"],
};
