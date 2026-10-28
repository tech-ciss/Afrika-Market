import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guards";
import { getCart } from "@/lib/services/cart.service";
import { CartView } from "@/components/features/cart-view";
import { GuestCart } from "@/components/features/guest-cart";

export const metadata: Metadata = {
  title: "Mon panier",
  description: "Votre panier AFRIKA MARKET : produits locaux d'Afrique de l'Ouest, prix en FCFA.",
};

export default async function CartPage() {
  const user = await getCurrentUser();
  const lines = user ? await getCart(user.id) : [];

  return (
    <div className="container-page py-8">
      <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-earth-500">
        <Link href="/" className="hover:text-brand-700">Accueil</Link> / <span className="text-earth-800">Panier</span>
      </nav>
      <h1 className="mb-6 text-3xl font-bold text-earth-900">Mon panier</h1>

      {user ? (
        <CartView
          isLoggedIn
          lines={lines.map((l) => ({
            id: l.id,
            productId: l.productId,
            variantId: l.variantId,
            name: l.name,
            slug: l.slug,
            image: l.image,
            unit: l.unit,
            producerName: l.producerName,
            unitPrice: l.unitPrice,
            quantity: l.quantity,
            availableStock: l.availableStock,
            compareAtPrice: l.compareAtPrice,
          }))}
        />
      ) : (
        <GuestCart />
      )}
    </div>
  );
}
