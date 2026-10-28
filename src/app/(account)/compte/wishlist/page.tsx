import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getProductsByIds } from "@/lib/services/catalog.service";
import { ProductCard } from "@/components/features/product-card";
import { EmptyState } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Ma liste d'envies" };

export default async function WishlistPage() {
  const user = await requireUser();
  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { productId: true },
  });
  const products = await getProductsByIds(items.map((i) => i.productId));

  return (
    <div>
      <h1 className="text-2xl font-bold text-earth-900">Ma liste d&apos;envies</h1>
      <p className="mt-1 text-sm text-earth-600">Retrouvez les produits que vous souhaitez acheter plus tard.</p>

      <div className="mt-6">
        {products.length === 0 ? (
          <EmptyState
            icon={<Heart className="h-10 w-10" />}
            title="Votre liste d'envies est vide"
            description="Cliquez sur le cœur d'une fiche produit pour l'enregistrer ici."
            action={
              <Link href="/produits" className="btn-primary btn-md">
                Parcourir la boutique
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} headingLevel="h2" priority={i < 4} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
