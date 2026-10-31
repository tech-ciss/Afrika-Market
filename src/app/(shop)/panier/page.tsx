import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/guards";
import { getCart } from "@/lib/services/cart.service";
import { getActiveZones } from "@/lib/services/delivery.service";
import { CheckoutSteps } from "@/components/features/checkout-steps";
import { CartView } from "@/components/features/cart-view";
import { GuestCart } from "@/components/features/guest-cart";

export const metadata: Metadata = {
  title: "Mon panier",
  description: "Votre panier AFRIKA MARKET : produits locaux d'Afrique de l'Ouest, prix en FCFA.",
};

export default async function CartPage() {
  const user = await getCurrentUser();
  const [lines, zones] = await Promise.all([user ? getCart(user.id) : Promise.resolve([]), getActiveZones()]);

  // Seuil de livraison offerte de la zone la plus courante (Abidjan) : donnée métier, pas une constante d'interface.
  const home = zones.find((z) => z.name === "Abidjan");
  const freeShipping = home?.freeFrom ? { threshold: home.freeFrom, city: home.name } : null;

  return (
    <div className="container-page py-8">
      <CheckoutSteps current={1} />
      <h1 className="mb-6 font-display text-3xl font-extrabold sm:text-4xl">Mon panier</h1>

      {user ? (
        <CartView
          isLoggedIn
          freeShipping={freeShipping}
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
        <GuestCart freeShipping={freeShipping} />
      )}
    </div>
  );
}
