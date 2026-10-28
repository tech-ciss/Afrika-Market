import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";

export type SessionUser = {
  id: string;
  role: "CLIENT" | "PRODUCER" | "ADMIN" | "SUPER_ADMIN";
  email?: string | null;
  name?: string | null;
};

/** Utilisateur connecté ou null. À appeler dans un Server Component / Server Action. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as SessionUser;
}

/** Lève une redirection vers /connexion si l'utilisateur n'est pas connecté. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/connexion?callbackUrl=/compte");
  }
  return user;
}

const DASHBOARDS: Record<string, string> = {
  ADMIN: "/admin",
  SUPER_ADMIN: "/admin",
  PRODUCER: "/vendeur",
  CLIENT: "/compte",
};

/**
 * Vérification d'autorisation par rôle (règle d'architecture §27).
 * Retourne l'utilisateur uniquement s'il possède l'un des rôles demandés.
 */
export async function requireRole(...roles: SessionUser["role"][]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect(DASHBOARDS[user.role] ?? "/");
  }
  return user;
}

export function isStaff(role: SessionUser["role"] | undefined): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}
