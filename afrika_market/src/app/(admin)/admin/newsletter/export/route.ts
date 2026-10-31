import { getCurrentUser, isStaff } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/** Neutralise l'« injection de formules » (=, +, -, @) quand le CSV est ouvert dans Excel. */
function cell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[;"\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/**
 * Export CSV des abonnés actifs (§22).
 * Route dédiée plutôt qu'une redirection vers une URL « data: », que les navigateurs bloquent.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return new Response("Non autorisé", { status: 403 });
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { isActive: true },
    select: { email: true, source: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = [
    "email;source;inscription",
    ...subscribers.map((s) => [cell(s.email), cell(s.source), s.createdAt.toISOString().slice(0, 10)].join(";")),
  ];
  const day = new Date().toISOString().slice(0, 10);

  return new Response(`\uFEFF${rows.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="abonnes-newsletter-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
