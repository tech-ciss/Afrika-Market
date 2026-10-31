import type { Metadata } from "next";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { formatDateFR, formatFCFA } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { togglePromoAction } from "@/actions/admin";
import { PromoForm, type PromoFormValues } from "@/components/features/admin-forms";
import { getCategories } from "@/lib/services/catalog.service";
import { Badge } from "@/components/ui/surfaces";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Promotions" };

async function togglePromoFormAction(formData: FormData) {
  "use server";
  await togglePromoAction(formData);
}

const TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: "Pourcentage",
  FIXED: "Montant fixe",
  FREE_SHIPPING: "Livraison offerte",
};

const SCOPE_LABELS: Record<string, string> = { GLOBAL: "Toute la boutique", CATEGORY: "Une catégorie", PRODUCT: "Un produit" };

function valueLabel(type: string, value: number) {
  if (type === "PERCENTAGE") return `-${value} %`;
  if (type === "FIXED") return `-${formatFCFA(value)}`;
  return "Livraison offerte";
}

export default async function AdminPromosPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const { edit } = await searchParams;

  const [promos, categories, products] = await Promise.all([
    prisma.promoCode.findMany({
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getCategories(true),
    prisma.product.findMany({ select: { id: true, name: true }, take: 200, orderBy: { name: "asc" } }),
  ]);

  const target = edit ? promos.find((p) => p.code === edit) : undefined;
  const values: PromoFormValues | undefined = target
    ? {
        code: target.code,
        description: target.description,
        type: target.type,
        scope: target.scope,
        value: target.value,
        minimumAmount: target.minimumAmount,
        maximumUses: target.maximumUses,
        maximumUsesPerUser: target.maximumUsesPerUser,
        productId: target.productId,
        categoryId: target.categoryId,
        startsAt: target.startsAt.toISOString().slice(0, 10),
        endsAt: target.endsAt ? target.endsAt.toISOString().slice(0, 10) : null,
        isActive: target.isActive,
      }
    : undefined;

  const now = new Date();

  return (
    <div>
      <PageHeader
        title="Codes promotionnels"
        description="Toutes les règles de réduction sont recalculées côté serveur : le client ne peut jamais fixer son prix."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_480px] xl:items-start">
        <ul className="space-y-3">
          {promos.map((p) => {
            const expired = p.endsAt !== null && p.endsAt < now;
            const live = p.isActive && !expired && p.startsAt <= now;
            const usage = p.maximumUses ? Math.min(100, Math.round((p._count.orders / p.maximumUses) * 100)) : null;
            return (
              <li
                key={p.id}
                className={cn("grid gap-4 rounded-2xl border bg-white p-4 sm:grid-cols-[170px_1fr] sm:p-5", target?.id === p.id ? "border-sun-400 ring-1 ring-sun-300" : "border-earth-200")}
              >
                {/* Le code, comme un coupon */}
                <div className={cn("flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-3 py-3 text-center", live ? "border-sun-400 bg-sun-50" : "border-earth-300 bg-earth-50 opacity-80")}>
                  <p className="break-all font-mono text-sm font-extrabold tracking-wider text-brand-900">{p.code}</p>
                  <p className="mt-0.5 font-display text-lg font-extrabold text-brand-800">{valueLabel(p.type, p.value)}</p>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 text-sm font-semibold text-earth-900">{p.description || TYPE_LABELS[p.type]}</p>
                    {!p.isActive ? <Badge tone="neutral">Inactif</Badge> : expired ? <Badge tone="warning">Expiré</Badge> : p.startsAt > now ? <Badge tone="brand">Programmé</Badge> : <Badge tone="success">Actif</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-earth-500">
                    {SCOPE_LABELS[p.scope] ?? p.scope}
                    {p.minimumAmount > 0 ? ` · dès ${formatFCFA(p.minimumAmount)}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-earth-500">
                    Du {formatDateFR(p.startsAt)} {p.endsAt ? `au ${formatDateFR(p.endsAt)}` : "· sans date de fin"}
                  </p>
                  <p className="mt-2 text-xs text-earth-600">
                    <span className="font-semibold tabular-nums">{p._count.orders}</span> utilisation{p._count.orders > 1 ? "s" : ""}
                    {p.maximumUses ? ` sur ${p.maximumUses}` : ""}
                  </p>
                  {usage !== null ? (
                    <div className="mt-1 h-1.5 w-full max-w-[12rem] overflow-hidden rounded-full bg-earth-100" aria-hidden>
                      <div className={cn("h-full rounded-full", usage >= 90 ? "bg-kola-500" : "bg-brand-600")} style={{ width: `${Math.max(3, usage)}%` }} />
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link href={`/admin/promotions?edit=${encodeURIComponent(p.code)}`} className="btn-secondary btn-sm" aria-label={`Modifier ${p.code}`}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden /> Modifier
                    </Link>
                    <form action={togglePromoFormAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="btn-ghost btn-sm">
                        {p.isActive ? "Désactiver" : "Activer"}
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="xl:sticky xl:top-28">
          <PromoForm
            key={target?.id ?? "new"}
            promo={values}
            categories={categories.flatMap((c) => [{ id: c.id, name: c.name }, ...c.children.map((s) => ({ id: s.id, name: s.name }))])}
            products={products}
          />
        </div>
      </div>
    </div>
  );
}
