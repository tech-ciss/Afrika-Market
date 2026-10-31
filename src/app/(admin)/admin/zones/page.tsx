import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Pencil } from "lucide-react";
import { formatFCFA, cn } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { ZoneForm, type ZoneFormValues } from "@/components/features/admin-forms";
import { Badge } from "@/components/ui/surfaces";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Zones de livraison" };

export default async function AdminZonesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const { edit } = await searchParams;

  const [zones, countries] = await Promise.all([
    prisma.deliveryZone.findMany({
      include: { country: { select: { name: true } }, districts: { orderBy: { name: "asc" } } },
      orderBy: { position: "asc" },
    }),
    prisma.country.findMany({ where: { isActive: true }, orderBy: { position: "asc" } }),
  ]);

  const target = edit ? zones.find((z) => z.id === edit) : undefined;
  const values: ZoneFormValues | undefined = target
    ? {
        id: target.id,
        name: target.name,
        description: target.description,
        countryId: target.countryId,
        basePrice: target.basePrice,
        freeFrom: target.freeFrom,
        estimatedDays: target.estimatedDays,
        allowCashOnDelivery: target.allowCashOnDelivery,
        isActive: target.isActive,
        districts: target.districts.map((d) => d.name),
      }
    : undefined;

  return (
    <div>
      <PageHeader
        title="Zones de livraison"
        description="Les frais dépendent de la zone, du montant de la commande et du mode choisi. Ajouter une ville = ajouter une zone, sans toucher au code."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_480px] xl:items-start">
        <ul className="space-y-3">
          {zones.map((z) => (
            <li
              key={z.id}
              className={cn("rounded-2xl border bg-white p-5", target?.id === z.id ? "border-sun-400 ring-1 ring-sun-300" : "border-earth-200", !z.isActive && "opacity-75")}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-display text-xl font-bold text-brand-950">
                    <MapPin className="h-4 w-4 text-forest-600" aria-hidden /> {z.name}
                    <span className="text-xs font-normal text-earth-500">{z.country.name}</span>
                  </p>
                  {z.description ? <p className="mt-0.5 text-xs text-earth-500">{z.description}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {z.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}
                  {z.allowCashOnDelivery ? <Badge tone="info">Paiement à la livraison</Badge> : null}
                  <Link href={`/admin/zones?edit=${z.id}`} className="btn-secondary btn-sm" aria-label={`Modifier ${z.name}`}>
                    <Pencil className="h-3.5 w-3.5" aria-hidden /> Modifier
                  </Link>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-earth-50 p-4 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-earth-500">Tarif</dt>
                  <dd className="mt-0.5 font-display text-lg font-extrabold text-brand-800">{z.basePrice === 0 ? "Gratuit" : formatFCFA(z.basePrice)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-earth-500">Offerte dès</dt>
                  <dd className="mt-0.5 font-semibold text-earth-900">{z.freeFrom ? formatFCFA(z.freeFrom) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-earth-500">Délai</dt>
                  <dd className="mt-0.5 font-semibold text-earth-900">{z.estimatedDays === 0 ? "Immédiat" : `${z.estimatedDays} jour${z.estimatedDays > 1 ? "s" : ""}`}</dd>
                </div>
                <div>
                  <dt className="text-xs text-earth-500">Communes</dt>
                  <dd className="mt-0.5 font-semibold text-earth-900">{z.districts.length}</dd>
                </div>
              </dl>

              {z.districts.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {z.districts.map((d) => (
                    <li key={d.id} className="rounded-full bg-earth-100 px-2.5 py-1 text-xs text-earth-700">
                      {d.name}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="xl:sticky xl:top-28">
          <ZoneForm key={target?.id ?? "new"} zone={values} countries={countries.map((c) => ({ id: c.id, name: c.name }))} />
        </div>
      </div>
    </div>
  );
}
