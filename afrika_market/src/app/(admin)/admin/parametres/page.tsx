import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { toggleCountryAction } from "@/actions/admin";
import { CountryForm } from "@/components/features/admin-forms";
import { Badge } from "@/components/ui/surfaces";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, StatStrip, Th } from "@/components/ui/stat";

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

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Clients",
  PRODUCER: "Producteurs",
  ADMIN: "Administrateurs",
  SUPER_ADMIN: "Super-administrateurs",
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-brand-950">{title}</h2>
      {description ? <p className="mt-1 max-w-2xl text-sm text-earth-600">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
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
    <div className="space-y-10">
      <PageHeader
        title="Paramètres"
        description="Pays, rôles et réglages généraux de la plateforme."
        actions={
          isSuper ? null : (
            <Badge tone="warning">
              <Lock className="mr-1 inline h-3 w-3" aria-hidden /> Lecture seule
            </Badge>
          )
        }
      />

      <Section title="Répartition des comptes">
        <StatStrip
          items={roles
            .slice()
            .sort((a, b) => b._count - a._count)
            .slice(0, 4)
            .map((r) => ({ label: ROLE_LABELS[r.role] ?? r.role, value: String(r._count) }))}
        />
      </Section>

      <Section
        title="Pays disponibles"
        description="Le lancement se fait en Côte d'Ivoire ; l'extension vers l'UEMOA s'active ici, pays par pays."
      >
        <DataTable className="min-w-0">
          <thead>
            <tr>
              <Th>Pays</Th>
              <Th>Code</Th>
              <Th>Devise</Th>
              <Th align="right">Statut</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-earth-100">
            {countries.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium text-earth-900">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-earth-600">{c.code}</td>
                <td className="px-4 py-3 text-earth-600">{c.currency}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {c.isActive ? <Badge tone="success">Actif</Badge> : <Badge tone="neutral">Inactif</Badge>}
                    {isSuper ? (
                      <form action={toggleCountryFormAction}>
                        <input type="hidden" name="code" value={c.code} />
                        {c.isActive ? (
                          <ConfirmButton message={`Désactiver ${c.name} ? Les livraisons vers ce pays ne seront plus proposées.`} className="btn-ghost btn-sm">
                            Désactiver
                          </ConfirmButton>
                        ) : (
                          <button type="submit" className="btn-secondary btn-sm">
                            Activer
                          </button>
                        )}
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {isSuper ? (
          <div className="mt-4">
            <CountryForm />
          </div>
        ) : null}
      </Section>

      <Section
        title="Réglages généraux"
        description={isSuper ? "Ces paramètres pilotent le comportement de la plateforme." : "La modification est réservée au super-administrateur."}
      >
        {settings.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-earth-300 bg-white px-4 py-8 text-center text-sm text-earth-600">Aucun réglage enregistré.</p>
        ) : (
          <ul className="divide-y divide-earth-100 overflow-hidden rounded-2xl border border-earth-200 bg-white">
            {settings.map((s) => (
              <li key={s.key} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-earth-900">{s.label}</p>
                  <p className="font-mono text-xs text-earth-500">{s.key}</p>
                </div>
                {isSuper ? (
                  <form action={saveSettingFormAction} className="flex items-center gap-2">
                    <input type="hidden" name="key" value={s.key} />
                    <input type="hidden" name="label" value={s.label} />
                    <input
                      name="value"
                      defaultValue={s.value}
                      aria-label={`Valeur de ${s.label}`}
                      className="w-44 rounded-full border border-earth-300 bg-white px-4 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <button type="submit" className="btn-secondary btn-sm">
                      Enregistrer
                    </button>
                  </form>
                ) : (
                  <p className="rounded-full bg-earth-100 px-3 py-1 text-sm font-semibold text-earth-800">{s.value}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
