import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getCategories } from "@/lib/services/catalog.service";
import { getProducerByUserId } from "@/lib/services/producer.service";
import { ProductForm } from "@/components/features/product-form";
import { PageHeader } from "@/components/ui/page-header";
import { parseJsonArray } from "@/lib/utils";

export const metadata: Metadata = { title: "Modifier un produit" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("PRODUCER", "ADMIN", "SUPER_ADMIN");
  const producer = await getProducerByUserId(user.id);
  if (!producer) notFound();

  const [product, categories, countries] = await Promise.all([
    prisma.product.findFirst({ where: { id, producerId: producer.id } }),
    getCategories(),
    prisma.country.findMany({ where: { isActive: true }, orderBy: { position: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <PageHeader title="Modifier le produit" description={product.name} />
      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          categoryId: product.categoryId,
          shortDescription: product.shortDescription,
          description: product.description,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          stock: product.stock,
          lowStockThreshold: product.lowStockThreshold,
          unit: product.unit,
          weight: product.weight,
          sku: product.sku,
          tags: product.tags,
          images: parseJsonArray<string>(product.images),
          countryId: product.countryId,
          region: product.region,
          city: product.city,
          originMethod: product.originMethod,
          harvestPeriod: product.harvestPeriod,
          conservation: product.conservation,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
        }}
        categories={categories.flatMap((c) => [
          { id: c.id, name: c.name },
          ...c.children.map((s) => ({ id: s.id, name: `— ${s.name}` })),
        ])}
        countries={countries.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
