import type { Metadata } from "next";
import { formatDateFR } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { toggleSubscriberAction } from "@/actions/admin";
import { Badge } from "@/components/ui/surfaces";

export const metadata: Metadata = { title: "Newsletter" };

async function toggleFormAction(formData: FormData) {
  "use server";
  await toggleSubscriberAction(formData);
}

/** Export CSV des abonnés (§22). */
async function exportSubscribers() {
  "use server";
  const { redirect } = await import("next/navigation");
  await requireRole("ADMIN", "SUPER_ADMIN");
  const subs = await prisma.newsletterSubscriber.findMany({
    where: { isActive: true },
    select: { email: true, source: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  const csv = [
    "email;source;inscription",
    ...subs.map((s) => `${s.email};${s.source};${s.createdAt.toISOString().slice(0, 10)}`),
  ].join("\n");
  const dataUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  redirect(dataUrl);
}

export default async function AdminNewsletterPage() {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const [total, active] = await Promise.all([
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({ where: { isActive: true } }),
  ]);
  const subscribers = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-earth-900">Newsletter ({active} actifs / {total})</h2>
          <p className="mt-1 text-sm text-earth-600">
            Inscriptions depuis le footer, la page d&apos;accueil ou le compte client.
          </p>
        </div>
        <form action={exportSubscribers}>
          <button type="submit" className="btn-secondary btn-md">
            Exporter les e-mails (CSV)
          </button>
        </form>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-earth-200 bg-white">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-earth-50 text-left text-xs uppercase tracking-wide text-earth-500">
            <tr>
              <th className="px-4 py-3">Adresse e-mail</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Inscription</th>
              <th className="px-4 py-3 text-right">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-earth-100">
            {subscribers.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-earth-900">{s.email}</td>
                <td className="px-4 py-3 text-earth-600">{s.source}</td>
                <td className="px-4 py-3 text-earth-600">{formatDateFR(s.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <form action={toggleFormAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="btn-ghost btn-sm">
                        {s.isActive ? "Désactiver" : "Réactiver"}
                      </button>
                    </form>
                    {s.isActive ? <Badge tone="success">Actif</Badge> : <Badge tone="danger">Inactif</Badge>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
