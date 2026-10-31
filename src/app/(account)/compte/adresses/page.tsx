import type { Metadata } from "next";
import { MapPin, Star } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { deleteAddressAction, setDefaultAddressAction } from "@/actions/account";
import { AddressForm } from "@/components/features/address-form";
import { Badge } from "@/components/ui/surfaces";
import { EmptyState } from "@/components/ui/feedback";
import { getActiveZones } from "@/lib/services/delivery.service";

export const metadata: Metadata = { title: "Mes adresses" };

/** Adaptateurs pour <form action={...}> : l'état détaillé est géré côté client. */
async function setDefaultAddressFormAction(formData: FormData) {
  "use server";
  await setDefaultAddressAction(formData);
}

async function deleteAddressFormAction(formData: FormData) {
  "use server";
  await deleteAddressAction(formData);
}

export default async function AddressesPage() {
  const user = await requireUser();
  const [addresses, zones] = await Promise.all([
    prisma.address.findMany({ where: { userId: user.id }, orderBy: { isDefault: "desc" } }),
    getActiveZones(),
  ]);
  const districts = zones.flatMap((z) => z.districts.map((d) => d.name));

  return (
    <div>
      <h1 className="text-2xl font-bold text-earth-900">Mes adresses</h1>
      <p className="mt-1 text-sm text-earth-600">
        Vos adresses accélèrent le checkout et déterminent la zone de livraison.
      </p>

      <div className="mt-6 space-y-4">
        {addresses.length === 0 ? (
          <EmptyState
            icon={<MapPin className="h-10 w-10" />}
            title="Aucune adresse enregistrée"
            description="Ajoutez une adresse pour être livré plus vite."
          />
        ) : (
          addresses.map((a) => (
            <div key={a.id} className="rounded-2xl border border-earth-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-semibold text-earth-900">
                    {a.label}
                    {a.isDefault ? <Badge tone="success">Par défaut</Badge> : null}
                  </p>
                  <p className="mt-1 text-sm text-earth-600">
                    {a.firstName} {a.lastName} · {a.phone}
                  </p>
                  <p className="mt-1 text-sm text-earth-600">
                    {a.street}
                    {a.neighborhood ? `, ${a.neighborhood}` : ""}, {a.district}, {a.city}
                  </p>
                  {a.additionalInfo ? <p className="mt-1 text-xs text-earth-500">{a.additionalInfo}</p> : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!a.isDefault ? (
                    <form action={setDefaultAddressFormAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="btn-ghost btn-sm inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5" /> Définir par défaut
                      </button>
                    </form>
                  ) : null}
                  <form action={deleteAddressFormAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="btn-ghost btn-sm text-kola-600 hover:bg-kola-50">
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))
        )}

        <AddressForm districts={districts} />
      </div>
    </div>
  );
}
