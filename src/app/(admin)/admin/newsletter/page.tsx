import type { Metadata } from "next";
import { Download } from "lucide-react";
import { formatDateFR } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { toggleSubscriberAction } from "@/actions/admin";
import { Badge } from "@/components/ui/surfaces";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, StatStrip, Th } from "@/components/ui/stat";

export const metadata: Metadata = { title: "Newsletter" };

async function toggleFormAction(formData: FormData) {
  "use server";
  await toggleSubscriberAction(formData);
}

const SOURCE_LABELS: Record<string, string> = { footer: "Pied de page", homepage: "Accueil", account: "Compte client", popup: "Fenêtre d'inscription" };

export default async function AdminNewsletterPage() {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const [total, active, subscribers] = await Promise.all([
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({ where: { isActive: true } }),
    prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Newsletter"
        description="Inscriptions depuis le pied de page, l'accueil ou le compte client."
        actions={
          <a href="/admin/newsletter/export" className="btn-primary btn-md" download>
            <Download className="h-4 w-4" aria-hidden /> Exporter les e-mails (CSV)
          </a>
        }
      />

      <StatStrip
        items={[
          { label: "Abonnés actifs", value: String(active) },
          { label: "Désinscrits", value: String(total - active) },
          { label: "Total des inscriptions", value: String(total) },
        ]}
      />

      <DataTable className="min-w-0">
        <thead>
          <tr>
            <Th>Adresse e-mail</Th>
            <Th>Source</Th>
            <Th>Inscription</Th>
            <Th align="right">Statut</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-earth-100">
          {subscribers.map((s) => (
            <tr key={s.id} className="hover:bg-earth-50/60">
              <td className="px-4 py-3 font-medium text-earth-900">{s.email}</td>
              <td className="px-4 py-3 text-earth-600">{SOURCE_LABELS[s.source] ?? s.source}</td>
              <td className="whitespace-nowrap px-4 py-3 text-earth-600">{formatDateFR(s.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  {s.isActive ? <Badge tone="success">Actif</Badge> : <Badge tone="neutral">Inactif</Badge>}
                  <form action={toggleFormAction}>
                    <input type="hidden" name="id" value={s.id} />
                    {s.isActive ? (
                      <ConfirmButton message={`Désactiver l'abonnement de ${s.email} ?`} className="btn-ghost btn-sm">
                        Désactiver
                      </ConfirmButton>
                    ) : (
                      <button type="submit" className="btn-secondary btn-sm">
                        Réactiver
                      </button>
                    )}
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      {total > 100 ? <p className="text-xs text-earth-500">Les 100 inscriptions les plus récentes sont affichées ; l&apos;export contient tous les abonnés actifs.</p> : null}
    </div>
  );
}
