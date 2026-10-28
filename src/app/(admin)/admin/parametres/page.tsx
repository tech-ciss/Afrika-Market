import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { toggleCountryAction } from "@/actions/admin";
import { CountryForm } from "@/components/features/admin-forms";
import { Badge } from "@/components/ui/surfaces";

export const metadata: Metadata = { title: "Paramètres" };

async function toggleCountryFormAction(formData: FormData) {
  "use server";
  await toggleCountryAction(formData);
}

async function saveSettingFormAction(formData: FormData) {
  "use server";
  const { saveSettingAction } = await import("@/actions/admin");
  await saveSettingAction(formData);
}

export default async function AdminSettingsPage() {
  const admin = await requireRole("SUPER_ADMIN", "ADMIN");
  const isSuper = admin.role === "SUPER_ADMIN";
  const [countries, settings, roles] = await Promise.all([
    prisma.country.findMany({ orderBy: { position: "asc" } }),
    prisma.setting.findMany({ orderBy: { key: "asc" } }),
    prisma.user.groupBy({ by: ["role"], _count: true }),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-bold text-earth-900">Pays disponibles (multi-pays)</h2>
        <p className="mt-1 text-sm text-earth-600">
          Le lancement se fait en Côte d&apos;Ivoire ; l&apos;extension UEMOA s&apos;active ici (bonus 2).
        </p>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-earth-200 bg-white">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-earth-50 text-left text-xs uppercase tracking-wide text-earth-500">
              <tr>
                <th className="px-4 py-3">Pays</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Devise</th>
                <th className="px-4 py-3 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-100">
              {countries.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-earth-900">{c.name}</td>
                  <td className="px-4 py-3 text-earth-600">{c.code}</td>
                  <td className="px-4 py-3 text-earth-600">{c.currency}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isSuper ? (
                        <form action={toggleCountryFormAction}>
                          <input type="hidden" name="code" value={c.code} />
                          <button type="submit" className="btn-ghost btn-sm">
                            {c.isActive ? "Désactiver" : "Activer"}
                          </button>
                        </form>
                      ) : null}
                      {c.isActive ? <Badge tone="success">Actif</Badge> : <Badge tone="danger">Inactif</Badge>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isSuper ? (
          <div className="mt-4">
            <CountryForm />
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="text-lg font-bold text-earth-900">Répartition des rôles</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {roles.map((r) => (
            <div key={r.role} className="rounded-xl border border-earth-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-earth-500">{r.role}</p>
              <p className="text-xl font-bold text-earth-900">{r._count}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-earth-900">Paramètres globaux</h2>
        <p className="mt-1 text-sm text-earth-600">
          {isSuper
            ? "Ces paramètres pilotent le comportement général de la plateforme."
            : "Lecture seule : la modification est réservée au super-administrateur."}
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-earth-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-earth-50 text-left text-xs uppercase tracking-wide text-earth-500">
              <tr>
                <th className="px-4 py-3">Clé</th>
                <th className="px-4 py-3">Libellé</th>
                <th className="px-4 py-3">Valeur</th>
                {isSuper ? <th className="px-4 py-3 text-right">Action</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-100">
              {settings.map((s) => (
                <tr key={s.key}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-earth-900">{s.key}</td>
                  <td className="px-4 py-3 text-earth-600">{s.label}</td>
                  <td className="px-4 py-3 text-earth-900">{s.value}</td>
                  {isSuper ? (
                    <td className="px-4 py-3 text-right">
                      <form action={saveSettingFormAction} className="flex items-center justify-end gap-2">
                        <input type="hidden" name="key" value={s.key} />
                        <input type="hidden" name="label" value={s.label} />
                        <input
                          name="value"
                          defaultValue={s.value}
                          aria-label={`Valeur de ${s.key}`}
                          className="w-40 rounded-lg border border-earth-300 px-2 py-1 text-xs"
                        />
                        <button type="submit" className="btn-secondary btn-sm">
                          Enregistrer
                        </button>
                      </form>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
