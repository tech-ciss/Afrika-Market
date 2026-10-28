import type { Metadata } from "next";
import { formatFCFA } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { ZoneForm } from "@/components/features/admin-forms";
import { Badge } from "@/components/ui/surfaces";

export const metadata: Metadata = { title: "Zones de livraison" };

export default async function AdminZonesPage() {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const [zones, countries] = await Promise.all([
    prisma.deliveryZone.findMany({
      include: { country: { select: { name: true } }, districts: { orderBy: { name: "asc" } } },
      orderBy: { position: "asc" },
    }),
    prisma.country.findMany({ where: { isActive: true }, orderBy: { position: "asc" } }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_520px]">
      <div>
        <h2 className="text-lg font-bold text-earth-900">Zones de livraison ({zones.length})</h2>
        <p className="mt-1 text-sm text-earth-600">
          Les frais dépendent de la zone, du montant de la commande et du mode choisi (§15).
        </p>

        <div className="mt-4 space-y-3">
          {zones.map((z) => (
            <div key={z.id} className="rounded-2xl border border-earth-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-earth-900">
                    {z.name} <span className="text-xs font-normal text-earth-500">({z.country.name})</span>
                  </p>
                  <p className="text-xs text-earth-500">{z.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {z.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Inactive</Badge>}
                  {z.allowCashOnDelivery ? <Badge tone="info">Paiement à la livraison</Badge> : null}
                </div>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-earth-500">Tarif</dt>
                  <dd className="font-semibold text-earth-900">{z.basePrice === 0 ? "Gratuit" : formatFCFA(z.basePrice)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-earth-500">Offerte dès</dt>
                  <dd className="font-semibold text-earth-900">{z.freeFrom ? formatFCFA(z.freeFrom) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-earth-500">Délai</dt>
                  <dd className="font-semibold text-earth-900">{z.estimatedDays} jour(s)</dd>
                </div>
                <div>
                  <dt className="text-xs text-earth-500">Communes</dt>
                  <dd className="font-semibold text-earth-900">{z.districts.length}</dd>
                </div>
              </dl>

              {z.districts.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {z.districts.map((d) => (
                    <li key={d.id} className="rounded-full bg-earth-100 px-2.5 py-1 text-xs text-earth-600">
                      {d.name}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div>
        <ZoneForm countries={countries.map((c) => ({ id: c.id, name: c.name }))} />
      </div>
    </div>
  );
}
