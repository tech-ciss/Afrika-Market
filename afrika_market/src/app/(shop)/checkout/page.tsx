import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getActiveZones } from "@/lib/services/delivery.service";
import { getCart } from "@/lib/services/cart.service";
import { CheckoutForm } from "@/components/features/checkout-form";
import { CheckoutSteps } from "@/components/features/checkout-steps";

export const metadata: Metadata = {
  title: "Finaliser ma commande",
  description: "Checkout AFRIKA MARKET : livraison par zone en Côte d'Ivoire, paiement Mobile Money, carte ou à la livraison.",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ promo?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [zones, lines, addresses] = await Promise.all([
    getActiveZones(),
    user ? getCart(user.id) : Promise.resolve([]),
    user
      ? prisma.address.findMany({ where: { userId: user.id }, orderBy: { isDefault: "desc" } })
      : Promise.resolve([]),
  ]);

  if (user && lines.length === 0) redirect("/panier");

  const profile = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { email: true, firstName: true, lastName: true, phone: true },
      })
    : null;

  return (
    <div className="container-page py-8">
      <CheckoutSteps current={2} />
      <h1 className="mb-6 font-display text-3xl font-extrabold sm:text-4xl">Finaliser ma commande</h1>
      <CheckoutForm
        user={profile}
        zones={zones}
        addresses={addresses.map((a) => ({
          id: a.id,
          label: a.label,
          firstName: a.firstName,
          lastName: a.lastName,
          phone: a.phone,
          city: a.city,
          district: a.district,
          neighborhood: a.neighborhood,
          street: a.street,
          additionalInfo: a.additionalInfo,
          isDefault: a.isDefault,
        }))}
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
        }))}
        initialPromo={sp.promo ?? ""}
      />
    </div>
  );
}
