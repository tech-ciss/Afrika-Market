import type { Metadata } from "next";
import Link from "next/link";
import { formatDateFR } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { moderateReviewAction } from "@/actions/admin";
import { Stars } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/surfaces";
import { Input } from "@/components/ui/fields";
import { FilterChips } from "@/components/ui/filter-chips";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Modération des avis" };

async function moderateFormAction(formData: FormData) {
  "use server";
  await moderateReviewAction(formData);
}

const STATUS_LABEL: Record<string, string> = { PENDING: "En attente", APPROVED: "Approuvé", REJECTED: "Rejeté" };
const STATUS_TONE: Record<string, "warning" | "success" | "danger"> = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" };

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const sp = await searchParams;
  const status = ["PENDING", "APPROVED", "REJECTED"].includes(sp.status ?? "") ? sp.status : undefined;

  const [reviews, grouped] = await Promise.all([
    prisma.review.findMany({
      where: status ? { status } : {},
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        product: { select: { name: true, slug: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
    }),
    prisma.review.groupBy({ by: ["status"], _count: true }),
  ]);
  const countOf = (s: string) => grouped.find((g) => g.status === s)?._count ?? 0;
  const all = grouped.reduce((n, g) => n + g._count, 0);

  return (
    <div>
      <PageHeader
        title="Avis clients"
        description="Un avis n'est publié qu'après modération ; la note moyenne du produit est recalculée automatiquement."
      />
      <FilterChips
        label="Filtrer les avis"
        items={[
          { key: "all", label: "Tous", href: "/admin/avis", count: all, active: !status },
          ...["PENDING", "APPROVED", "REJECTED"].map((s) => ({
            key: s,
            label: STATUS_LABEL[s]!,
            href: `/admin/avis?status=${s}`,
            count: countOf(s),
            active: status === s,
          })),
        ]}
      />

      {reviews.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-earth-300 bg-white px-4 py-10 text-center text-sm text-earth-600">
          Aucun avis dans cette vue.
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className={`rounded-2xl border bg-white p-5 ${r.status === "PENDING" ? "border-sun-300 ring-1 ring-sun-200" : "border-earth-200"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/produits/${r.product.slug}`} className="font-display text-lg font-bold leading-tight text-brand-950 hover:text-brand-700">
                    {r.product.name}
                  </Link>
                  <p className="mt-1 text-xs text-earth-500">
                    {r.user.firstName} {r.user.lastName.charAt(0)}. · {r.user.email} · {formatDateFR(r.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Stars value={r.rating} size={16} />
                  <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{STATUS_LABEL[r.status] ?? r.status}</Badge>
                </div>
              </div>

              <blockquote className="mt-3 border-l-4 border-sun-300 pl-4 text-sm leading-relaxed text-earth-700">{r.comment}</blockquote>

              <form action={moderateFormAction} className="mt-4 flex flex-wrap items-end gap-2 border-t border-earth-100 pt-4">
                <input type="hidden" name="reviewId" value={r.id} />
                <div className="min-w-64 flex-1">
                  <label htmlFor={`reply-${r.id}`} className="mb-1 block text-xs font-medium text-earth-600">
                    Réponse du producteur (optionnelle, publiée sous l&apos;avis)
                  </label>
                  <Input id={`reply-${r.id}`} name="reply" defaultValue={r.reply ?? ""} placeholder="Merci pour votre retour !" />
                </div>
                <button type="submit" name="status" value="APPROVED" className="btn-primary btn-sm">
                  Approuver
                </button>
                <button type="submit" name="status" value="REJECTED" className="btn-ghost btn-sm text-kola-600 hover:bg-kola-50">
                  Rejeter
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
