import type { Metadata } from "next";
import { formatDateFR } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { moderateReviewAction } from "@/actions/admin";
import { Stars } from "@/components/ui/feedback";
import { Alert, Badge, Card, CardContent } from "@/components/ui/surfaces";
import { Input } from "@/components/ui/fields";

export const metadata: Metadata = { title: "Modération des avis" };

async function moderateFormAction(formData: FormData) {
  "use server";
  await moderateReviewAction(formData);
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const sp = await searchParams;
  const status = ["PENDING", "APPROVED", "REJECTED"].includes(sp.status ?? "") ? sp.status : undefined;

  const reviews = await prisma.review.findMany({
    where: status ? { status } : {},
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      product: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const tabs = [
    { key: "", label: "Tous" },
    { key: "PENDING", label: "En attente" },
    { key: "APPROVED", label: "Approuvés" },
    { key: "REJECTED", label: "Rejetés" },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold text-earth-900">Avis clients ({reviews.length})</h2>
      <p className="mt-1 text-sm text-earth-600">
        Un avis n&apos;est publié qu&apos;après modération ; la note moyenne du produit est recalculée automatiquement.
      </p>

      <nav className="mt-3 flex gap-1.5">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={t.key ? `/admin/avis?status=${t.key}` : "/admin/avis"}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${(!status && !t.key) || status === t.key ? "bg-brand-600 text-white" : "border border-earth-300 bg-white text-earth-700"}`}
          >
            {t.label}
          </a>
        ))}
      </nav>

      {reviews.length === 0 ? <Alert tone="info" className="mt-4">Aucun avis dans cette vue.</Alert> : null}

      <div className="mt-4 space-y-4">
        {reviews.map((r) => (
          <Card key={r.id}>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-earth-900">
                    {r.product.name} · {r.user.firstName} {r.user.lastName.charAt(0)}.
                  </p>
                  <p className="text-xs text-earth-500">
                    {r.user.email} · {formatDateFR(r.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} size={14} />
                  <Badge
                    tone={r.status === "APPROVED" ? "success" : r.status === "PENDING" ? "warning" : "danger"}
                  >
                    {r.status}
                  </Badge>
                </div>
              </div>

              <p className="mt-2 text-sm text-earth-700">{r.comment}</p>

              <form action={moderateFormAction} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="reviewId" value={r.id} />
                <div className="min-w-64 flex-1">
                  <label htmlFor={`reply-${r.id}`} className="mb-1 block text-xs font-medium text-earth-600">
                    Réponse du producteur (optionnel)
                  </label>
                  <Input id={`reply-${r.id}`} name="reply" defaultValue={r.reply ?? ""} placeholder="Merci pour votre retour !" />
                </div>
                <button type="submit" name="status" value="APPROVED" className="btn-dark btn-sm">
                  Approuver
                </button>
                <button type="submit" name="status" value="REJECTED" className="btn-ghost btn-sm text-red-600 hover:bg-red-50">
                  Rejeter
                </button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
