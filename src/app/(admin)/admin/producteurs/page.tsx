import type { Metadata } from "next";
import Link from "next/link";
import { formatDateFR } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { setProducerStatusAction } from "@/actions/admin";
import { PRODUCER_STATUS_LABELS, type ProducerStatus } from "@/lib/validations/enums";
import { Badge, Card, CardContent } from "@/components/ui/surfaces";

export const metadata: Metadata = { title: "Producteurs" };

async function setStatusFormAction(formData: FormData) {
  "use server";
  await setProducerStatusAction(formData);
}

const TONES: Record<ProducerStatus, "success" | "warning" | "danger" | "neutral"> = {
  APPROVED: "success",
  PENDING: "warning",
  SUSPENDED: "danger",
  REJECTED: "neutral",
};

export default async function AdminProducersPage() {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const producers = await prisma.producer.findMany({
    include: {
      country: { select: { name: true } },
      user: { select: { email: true } },
      _count: { select: { products: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <h2 className="text-lg font-bold text-earth-900">Producteurs ({producers.length})</h2>
      <p className="mt-1 text-sm text-earth-600">
        Un producteur ne publie qu&apos;après validation administrative (statut PENDING → APPROVED).
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {producers.map((p) => (
          <Card key={p.id}>
            <CardContent>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/producteurs/${p.slug}`} className="font-semibold text-earth-900 hover:text-brand-700">
                    {p.name}
                  </Link>
                  <p className="text-xs text-earth-500">
                    {p.user.email} · {p.city}, {p.region} · {p.country.name}
                  </p>
                  <p className="mt-1 text-xs text-earth-500">
                    Inscrit le {formatDateFR(p.createdAt)} · {p._count.products} produit(s)
                  </p>
                </div>
                <Badge tone={TONES[p.status as ProducerStatus] ?? "neutral"}>
                  {PRODUCER_STATUS_LABELS[p.status as ProducerStatus]}
                </Badge>
              </div>

              <p className="mt-2 line-clamp-2 text-sm text-earth-600">{p.description}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {(["APPROVED", "PENDING", "SUSPENDED", "REJECTED"] as ProducerStatus[]).map((status) => (
                  <form key={status} action={setStatusFormAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="status" value={status} />
                    <button
                      type="submit"
                      disabled={p.status === status}
                      className={p.status === status ? "btn-secondary btn-sm opacity-40" : "btn-secondary btn-sm"}
                    >
                      {PRODUCER_STATUS_LABELS[status]}
                    </button>
                  </form>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
