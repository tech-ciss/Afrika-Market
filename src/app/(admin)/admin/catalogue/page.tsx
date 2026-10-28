import type { Metadata } from "next";
import { getCategories } from "@/lib/services/catalog.service";
import { requireRole } from "@/lib/auth/guards";
import { CategoryForm } from "@/components/features/admin-forms";
import { Badge } from "@/components/ui/surfaces";

export const metadata: Metadata = { title: "Catégories" };

export default async function AdminCategoriesPage() {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const categories = await getCategories(true);

  const flat = categories.flatMap((c) => [
    { id: c.id, name: c.name, level: 0, slug: c.slug, count: c.productCount },
    ...c.children.map((s) => ({ id: s.id, name: s.name, level: 1, slug: s.slug, count: s.productCount })),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_460px]">
      <div>
        <h2 className="text-lg font-bold text-earth-900">Catégories ({flat.length})</h2>
        <p className="mt-1 text-sm text-earth-600">
          Une catégorie peut posséder des sous-catégories (§7 A1).
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-earth-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-earth-50 text-left text-xs uppercase tracking-wide text-earth-500">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3 text-right">Produits</th>
                <th className="px-4 py-3 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-100">
              {flat.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    <span style={{ paddingLeft: `${c.level * 16}px` }} className="font-medium text-earth-900">
                      {c.level > 0 ? "↳ " : ""}
                      {c.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-earth-500">{c.slug}</td>
                  <td className="px-4 py-3 text-right text-earth-600">{c.count}</td>
                  <td className="px-4 py-3 text-right">
                    <Badge tone="success">Active</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <CategoryForm
          categories={categories.flatMap((c) => [{ id: c.id, name: c.name }, ...c.children.map((s) => ({ id: s.id, name: `— ${s.name}` }))])}
        />
      </div>
    </div>
  );
}
