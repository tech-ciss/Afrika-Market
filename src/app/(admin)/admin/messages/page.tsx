import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { formatDateFR, formatDateTimeFR } from "@/lib/utils";
import { Alert, Badge } from "@/components/ui/surfaces";

export const metadata: Metadata = { title: "Messages reçus" };

export default async function AdminMessagesPage() {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div>
      <h2 className="text-lg font-bold text-earth-900">Messages de contact ({messages.length})</h2>
      <p className="mt-1 text-sm text-earth-600">Reçus depuis la page /contact.</p>

      {messages.length === 0 ? (
        <Alert tone="info" className="mt-4">
          Aucun message pour le moment.
        </Alert>
      ) : (
        <div className="mt-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="rounded-2xl border border-earth-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-earth-900">{m.subject}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-earth-500">{formatDateTimeFR(m.createdAt)}</span>
                  {m.isRead ? <Badge tone="success">Lu</Badge> : <Badge tone="warning">Nouveau</Badge>}
                </div>
              </div>
              <p className="text-xs text-earth-500">
                {m.name} · {m.email} · {formatDateFR(m.createdAt)}
              </p>
              <p className="mt-2 whitespace-pre-line text-sm text-earth-700">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
