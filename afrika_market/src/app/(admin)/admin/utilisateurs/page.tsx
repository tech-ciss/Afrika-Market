import type { Metadata } from "next";
import { formatDateFR } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { toggleUserActiveAction, setUserRoleAction } from "@/actions/admin";
import { USER_ROLES, type UserRole } from "@/lib/validations/enums";
import { Badge } from "@/components/ui/surfaces";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Pagination } from "@/components/ui/feedback";
import { FilterChips, SearchBox } from "@/components/ui/filter-chips";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, Th } from "@/components/ui/stat";

export const metadata: Metadata = { title: "Utilisateurs" };

async function setRoleFormAction(formData: FormData) {
  "use server";
  await setUserRoleAction(formData);
}
async function toggleActiveFormAction(formData: FormData) {
  "use server";
  await toggleUserActiveAction(formData);
}

const ROLE_LABELS: Record<UserRole, string> = {
  CLIENT: "Client",
  PRODUCER: "Producteur",
  ADMIN: "Administrateur",
  SUPER_ADMIN: "Super-admin",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string; page?: string }>;
}) {
  const admin = await requireRole("ADMIN", "SUPER_ADMIN");
  const sp = await searchParams;
  const role = USER_ROLES.includes(sp.role as UserRole) ? (sp.role as UserRole) : undefined;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const perPage = 25;

  const where = {
    ...(role ? { role } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { firstName: { contains: q, mode: "insensitive" as const } },
            { lastName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, users, byRole] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { producer: { select: { name: true } }, _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.user.groupBy({ by: ["role"], _count: true }),
  ]);
  const all = byRole.reduce((n, r) => n + r._count, 0);
  const href = (r?: string) => {
    const p = new URLSearchParams();
    if (r) p.set("role", r);
    if (q) p.set("q", q);
    return `/admin/utilisateurs${p.toString() ? `?${p}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        description={
          admin.role === "SUPER_ADMIN"
            ? "En tant que super-administrateur, vous pouvez modifier les rôles."
            : "La gestion des rôles est réservée au super-administrateur."
        }
      />
      <SearchBox action="/admin/utilisateurs" defaultValue={q} placeholder="Nom ou adresse e-mail" hidden={{ role }} />
      <FilterChips
        label="Filtrer par rôle"
        items={[
          { key: "all", label: "Tous", href: href(), count: all, active: !role },
          ...USER_ROLES.map((r) => ({
            key: r,
            label: ROLE_LABELS[r],
            href: href(r),
            count: byRole.find((x) => x.role === r)?._count ?? 0,
            active: role === r,
          })),
        ]}
      />

      <DataTable className="min-w-0">
        <thead>
          <tr>
            <Th>Utilisateur</Th>
            <Th>Rôle</Th>
            <Th>Inscription</Th>
            <Th align="right">Commandes</Th>
            <Th align="right">Compte</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-earth-100">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-earth-50/60">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800"
                    aria-hidden
                  >
                    {`${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-earth-900">
                      {u.firstName} {u.lastName}
                      {!u.isActive ? <Badge tone="danger" className="ml-2">Désactivé</Badge> : null}
                    </p>
                    <p className="truncate text-xs text-earth-500">
                      {u.email}
                      {u.producer ? ` · ${u.producer.name}` : ""}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                {admin.role === "SUPER_ADMIN" ? (
                  <form action={setRoleFormAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <select
                      name="role"
                      defaultValue={u.role}
                      className="rounded-full border border-earth-300 bg-white px-3 py-1 text-xs"
                      aria-label={`Rôle de ${u.firstName} ${u.lastName}`}
                    >
                      {USER_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="btn-secondary btn-sm">
                      Appliquer
                    </button>
                  </form>
                ) : (
                  <Badge tone={u.role === "CLIENT" ? "neutral" : "brand"}>{ROLE_LABELS[u.role as UserRole]}</Badge>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-earth-600">{formatDateFR(u.createdAt)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-earth-600">{u._count.orders}</td>
              <td className="px-4 py-3 text-right">
                <form action={toggleActiveFormAction}>
                  <input type="hidden" name="id" value={u.id} />
                  {u.isActive ? (
                    <ConfirmButton
                      message={`Désactiver le compte de ${u.firstName} ${u.lastName} ? Cette personne ne pourra plus se connecter.`}
                      disabled={u.id === admin.id}
                      className="btn-ghost btn-sm text-kola-600 hover:bg-kola-50 disabled:opacity-40"
                    >
                      Désactiver
                    </ConfirmButton>
                  ) : (
                    <button type="submit" className="btn-secondary btn-sm">
                      Réactiver
                    </button>
                  )}
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>

      <Pagination
        page={page}
        pageCount={Math.max(1, Math.ceil(total / perPage))}
        basePath="/admin/utilisateurs"
        searchParams={{ role, q: q || undefined }}
      />
    </div>
  );
}
