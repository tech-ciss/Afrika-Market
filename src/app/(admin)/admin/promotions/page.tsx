import type { Metadata } from "next";
import { formatDateFR } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { togglePromoAction } from "@/actions/admin";
import { PromoForm } from "@/components/features/admin-forms";
import { getCategories } from "@/lib/services/catalog.service";
import { Badge } from "@/components/ui/surfaces";

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

export default async function AdminPromosPage() {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const [promos, categories, products] = await Promise.all([
    prisma.promoCode.findMany({
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getCategories(true),
    prisma.product.findMany({ select: { id: true, name: true }, take: 200, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_520px]">
      <div>
        <h2 className="text-lg font-bold text-earth-900">Codes promotionnels ({promos.length})</h2>
        <p className="mt-1 text-sm text-earth-600">
          Toutes les règles de réduction sont recalculées côté serveur (§19).
        </p>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-earth-200 bg-white">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-earth-50 text-left text-xs uppercase tracking-wide text-earth-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Valeur</th>
                <th className="px-4 py-3">Validité</th>
                <th className="px-4 py-3 text-right">Utilisations</th>
                <th className="px-4 py-3 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-100">
              {promos.map((p) => {
                const expired = p.endsAt && p.endsAt < new Date();
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <p className="font-mono font-bold text-earth-900">{p.code}</p>
                      <p className="text-xs text-earth-500">{p.description}</p>
                    </td>
                    <td className="px-4 py-3 text-earth-600">{TYPE_LABELS[p.type]}</td>
                    <td className="px-4 py-3 text-right font-semibold text-earth-900">
                      {p.type === "PERCENTAGE" ? `${p.value} %` : p.type === "FIXED" ? `${p.value} FCFA` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-earth-600">
                      {formatDateFR(p.startsAt)} → {p.endsAt ? formatDateFR(p.endsAt) : "illimité"}
                    </td>
                    <td className="px-4 py-3 text-right text-earth-600">{p._count.orders}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <form action={togglePromoFormAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <button type="submit" className="btn-ghost btn-sm">
                            {p.isActive ? "Désactiver" : "Activer"}
                          </button>
                        </form>
                        {!p.isActive ? (
                          <Badge tone="danger">Inactif</Badge>
                        ) : expired ? (
                          <Badge tone="warning">Expiré</Badge>
                        ) : (
                          <Badge tone="success">Actif</Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <PromoForm
          categories={categories.flatMap((c) => [{ id: c.id, name: c.name }, ...c.children.map((s) => ({ id: s.id, name: s.name }))])}
          products={products}
        />
      </div>
    </div>
  );
}
