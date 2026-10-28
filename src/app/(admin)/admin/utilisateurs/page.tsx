import type { Metadata } from "next";
import { formatDateFR } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { toggleUserActiveAction, setUserRoleAction } from "@/actions/admin";
import { USER_ROLES, type UserRole } from "@/lib/validations/enums";
import { Badge } from "@/components/ui/surfaces";

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

export default async function AdminUsersPage() {
  const admin = await requireRole("ADMIN", "SUPER_ADMIN");
  const users = await prisma.user.findMany({
    include: { producer: { select: { name: true } }, _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="text-lg font-bold text-earth-900">Utilisateurs ({users.length})</h2>
      <p className="mt-1 text-sm text-earth-600">
        La gestion des rôles est réservée au super-administrateur.
      </p>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-earth-200 bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-earth-50 text-left text-xs uppercase tracking-wide text-earth-500">
            <tr>
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Inscription</th>
              <th className="px-4 py-3 text-right">Commandes</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-earth-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-earth-50/60">
                <td className="px-4 py-3">
                  <p className="font-medium text-earth-900">
                    {u.firstName} {u.lastName}
                    {!u.isActive ? <Badge tone="danger" className="ml-2">Désactivé</Badge> : null}
                  </p>
                  <p className="text-xs text-earth-500">
                    {u.email}
                    {u.producer ? ` · ${u.producer.name}` : ""}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {admin.role === "SUPER_ADMIN" ? (
                    <form action={setRoleFormAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="rounded-lg border border-earth-300 px-2 py-1 text-xs"
                        aria-label={`Rôle de ${u.firstName}`}
                      >
                        {USER_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="btn-secondary btn-sm">
                        OK
                      </button>
                    </form>
                  ) : (
                    <span className="text-earth-600">{ROLE_LABELS[u.role as UserRole]}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-earth-600">{formatDateFR(u.createdAt)}</td>
                <td className="px-4 py-3 text-right text-earth-600">{u._count.orders}</td>
                <td className="px-4 py-3 text-right">
                  <form action={toggleActiveFormAction}>
                    <input type="hidden" name="id" value={u.id} />
                    <button
                      type="submit"
                      disabled={u.id === admin.id}
                      className="btn-ghost btn-sm text-red-600 hover:bg-red-50 disabled:opacity-40"
                    >
                      {u.isActive ? "Désactiver" : "Réactiver"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
