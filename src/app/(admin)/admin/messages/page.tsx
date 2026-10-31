import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { markMessageReadAction } from "@/actions/admin";
import { formatDateTimeFR, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/surfaces";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Messages reçus" };

async function markReadFormAction(formData: FormData) {
  "use server";
  await markMessageReadAction(formData);
}

export default async function AdminMessagesPage() {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const messages = await prisma.contactMessage.findMany({
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 100,
  });
  const unread = messages.filter((m) => !m.isRead).length;

  return (
    <div>
      <PageHeader
        title="Messages reçus"
        description={messages.length === 0 ? "Reçus depuis la page Contact." : `${unread} non lu${unread > 1 ? "s" : ""} sur ${messages.length}. Reçus depuis la page Contact.`}
      />

      {messages.length === 0 ? (
        <EmptyState title="Aucun message" description="Les messages envoyés depuis la page Contact apparaîtront ici." icon={<Mail className="h-9 w-9" aria-hidden />} />
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className={cn("rounded-2xl border bg-white p-5", m.isRead ? "border-earth-200" : "border-sun-300 border-l-4 border-l-sun-400")}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-display text-lg font-bold leading-tight text-brand-950">{m.subject}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-earth-500">{formatDateTimeFR(m.createdAt)}</span>
                  {m.isRead ? <Badge tone="neutral">Lu</Badge> : <Badge tone="warning">Nouveau</Badge>}
                </div>
              </div>
              <p className="mt-1 text-xs text-earth-500">
                {m.name} · {m.email}
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-earth-700">{m.message}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-earth-100 pt-3">
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                  className="btn-primary btn-sm"
                >
                  <Mail className="h-3.5 w-3.5" aria-hidden /> Répondre par e-mail
                </a>
                {!m.isRead ? (
                  <form action={markReadFormAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <button type="submit" className="btn-secondary btn-sm">
                      Marquer comme lu
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
