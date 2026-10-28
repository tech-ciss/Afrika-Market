import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { getCategories } from "@/lib/services/catalog.service";
import { prisma } from "@/lib/db/prisma";
import { ProductForm } from "@/components/features/product-form";

export const metadata: Metadata = { title: "Ajouter un produit" };

export default async function NewProductPage() {
  await requireRole("PRODUCER", "ADMIN", "SUPER_ADMIN");
  const [categories, countries] = await Promise.all([
    getCategories(),
    prisma.country.findMany({ where: { isActive: true }, orderBy: { position: "asc" } }),
  ]);

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-earth-900">Ajouter un produit</h2>
      <ProductForm
        categories={categories.flatMap((c) => [{ id: c.id, name: c.name }, ...c.children.map((s) => ({ id: s.id, name: `— ${s.name}` }))])}
        countries={countries.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
