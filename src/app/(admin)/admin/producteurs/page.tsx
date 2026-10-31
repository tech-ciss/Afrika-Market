import type { Metadata } from "next";
import Link from "next/link";
import { Check, MapPin, X } from "lucide-react";
import { formatDateFR, cn } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { setProducerStatusAction } from "@/actions/admin";
import { PRODUCER_STATUS_LABELS, type ProducerStatus } from "@/lib/validations/enums";
import { PLACEHOLDER_IMAGE } from "@/lib/images";
import { Badge } from "@/components/ui/surfaces";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { PageHeader } from "@/components/ui/page-header";
import { SmartImage } from "@/components/ui/smart-image";

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

/** Les producteurs à valider d'abord : c'est la seule chose qui attend une décision. */
const ORDER: Record<string, number> = { PENDING: 0, APPROVED: 1, SUSPENDED: 2, REJECTED: 3 };

const FILTERS: { key: ProducerStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "Tous" },
  { key: "PENDING", label: "À approuver" },
  { key: "APPROVED", label: "Approuvés" },
  { key: "SUSPENDED", label: "Suspendus" },
  { key: "REJECTED", label: "Refusés" },
];

function StatusForm({
  id,
  status,
  label,
  className,
  confirm,
  icon,
}: {
  id: string;
  status: ProducerStatus;
  label: string;
  className: string;
  confirm?: string;
  icon?: React.ReactNode;
}) {
  return (
    <form action={setStatusFormAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      {confirm ? (
        <ConfirmButton message={confirm} className={className}>
          {icon} {label}
        </ConfirmButton>
      ) : (
        <button type="submit" className={className}>
          {icon} {label}
        </button>
      )}
    </form>
  );
}

export default async function AdminProducersPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const { statut } = await searchParams;
  const filter = FILTERS.find((f) => f.key === statut)?.key ?? "ALL";

  const all = await prisma.producer.findMany({
    include: {
      country: { select: { name: true } },
      user: { select: { email: true } },
      _count: { select: { products: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const countOf = (k: string) => (k === "ALL" ? all.length : all.filter((p) => p.status === k).length);
  const producers = all
    .filter((p) => filter === "ALL" || p.status === filter)
    .sort((a, b) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9));
  const pending = countOf("PENDING");

  return (
    <div>
      <PageHeader
        title="Producteurs"
        description="Un producteur ne publie qu'après validation par l'équipe : statut En attente, puis Approuvé."
      />

      {pending > 0 && filter === "ALL" ? (
        <p className="mb-4 rounded-xl border border-sun-300 bg-sun-50 px-4 py-3 text-sm font-medium text-brand-950">
          {pending} producteur{pending > 1 ? "s" : ""} en attente d&apos;approbation : les boutons « Approuver » et « Refuser » sont en
          tête de liste.
        </p>
      ) : null}

      <nav aria-label="Filtrer par statut" className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "ALL" ? "/admin/producteurs" : `/admin/producteurs?statut=${f.key}`}
            aria-current={filter === f.key ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "border-brand-800 bg-brand-800 text-white"
                : "border-earth-300 bg-white text-earth-700 hover:border-brand-300 hover:bg-brand-50",
            )}
          >
            {f.label}
            <span className={cn("text-xs tabular-nums", filter === f.key ? "text-sun-300" : "text-earth-500")}>{countOf(f.key)}</span>
          </Link>
        ))}
      </nav>

      {producers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-earth-300 bg-white px-4 py-10 text-center text-sm text-earth-600">
          Aucun producteur dans cette vue.
        </p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {producers.map((p) => {
            const status = p.status as ProducerStatus;
            return (
              <li
                key={p.id}
                className={cn("rounded-2xl border bg-white p-5", status === "PENDING" ? "border-sun-300 ring-1 ring-sun-200" : "border-earth-200")}
              >
                <div className="flex items-start gap-4">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-100">
                    <SmartImage src={p.logoUrl || PLACEHOLDER_IMAGE} alt="" fill sizes="56px" className="object-cover" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/producteurs/${p.slug}`} className="inline-block py-1 font-display text-lg font-bold leading-tight text-brand-950 hover:text-brand-700">
                        {p.name}
                      </Link>
                      <Badge tone={TONES[status] ?? "neutral"}>{PRODUCER_STATUS_LABELS[status]}</Badge>
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-earth-500">
                      <MapPin className="h-3 w-3 text-forest-600" aria-hidden /> {p.city}, {p.region} · {p.country.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-earth-500">{p.user.email}</p>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-earth-600">{p.description}</p>
                <p className="mt-2 text-xs text-earth-500">
                  Inscrit le {formatDateFR(p.createdAt)} · {p._count.products} produit{p._count.products > 1 ? "s" : ""}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-earth-100 pt-4">
                  {status === "PENDING" ? (
                    <>
                      <StatusForm id={p.id} status="APPROVED" label="Approuver" className="btn-primary btn-sm" icon={<Check className="h-3.5 w-3.5" aria-hidden />} />
                      <StatusForm
                        id={p.id}
                        status="REJECTED"
                        label="Refuser"
                        className="btn-secondary btn-sm"
                        icon={<X className="h-3.5 w-3.5" aria-hidden />}
                        confirm={`Refuser la candidature de ${p.name} ?`}
                      />
                    </>
                  ) : status === "APPROVED" ? (
                    <StatusForm
                      id={p.id}
                      status="SUSPENDED"
                      label="Suspendre"
                      className="btn-secondary btn-sm"
                      confirm={`Suspendre ${p.name} ? Sa fiche et ses produits ne seront plus visibles.`}
                    />
                  ) : (
                    <StatusForm
                      id={p.id}
                      status="APPROVED"
                      label={status === "SUSPENDED" ? "Réactiver" : "Approuver"}
                      className="btn-primary btn-sm"
                    />
                  )}
                  {status !== "PENDING" ? (
                    <StatusForm id={p.id} status="PENDING" label="Remettre en attente" className="btn-ghost btn-sm" />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
