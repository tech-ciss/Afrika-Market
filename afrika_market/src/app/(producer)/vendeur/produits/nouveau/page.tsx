import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { getCategories } from "@/lib/services/catalog.service";
import { prisma } from "@/lib/db/prisma";
import { ProductForm } from "@/components/features/product-form";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Ajouter un produit" };

export default async function NewProductPage() {
  await requireRole("PRODUCER", "ADMIN", "SUPER_ADMIN");
  const [categories, countries] = await Promise.all([
    getCategories(),
    prisma.country.findMany({ where: { isActive: true }, orderBy: { position: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Ajouter un produit" description="Une bonne fiche : une belle photo, un prix clair et surtout l'origine du produit." />
      <ProductForm
        categories={categories.flatMap((c) => [{ id: c.id, name: c.name }, ...c.children.map((s) => ({ id: s.id, name: `— ${s.name}` }))])}
        countries={countries.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
