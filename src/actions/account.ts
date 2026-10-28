"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/guards";
import { addressSchema } from "@/lib/validations/commerce";
import { reviewSchema } from "@/lib/validations/catalog";
import type { ActionState } from "@/actions/auth";

// ---------------------------------------------------------------------------
// Wishlist (§17)
// ---------------------------------------------------------------------------

export async function toggleWishlistAction(
  productId: string,
): Promise<{ ok: boolean; inWishlist?: boolean; error?: string }> {
  const user = await requireUser().catch(() => null);
  if (!user) return { ok: false, error: "CONNECT" };

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/compte/wishlist");
    return { ok: true, inWishlist: false };
  }
  await prisma.wishlistItem.create({ data: { userId: user.id, productId } });
  revalidatePath("/compte/wishlist");
  return { ok: true, inWishlist: true };
}

// ---------------------------------------------------------------------------
// Avis (§18) — uniquement pour un achat réel
// ---------------------------------------------------------------------------

export async function submitReviewAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, error: "Veuillez corriger votre avis." };
  }

  // Preuve d'achat : une ligne de commande payée et non annulée.
  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId: parsed.data.productId,
      order: { userId: user.id, status: { notIn: ["CANCELLED", "REFUNDED", "PENDING_PAYMENT"] } },
    },
    select: { id: true, orderId: true },
  });
  if (!purchased) {
    return { error: "Seul un client ayant acheté ce produit peut laisser un avis." };
  }

  const already = await prisma.review.findFirst({
    where: { productId: parsed.data.productId, userId: user.id, orderId: purchased.orderId },
  });
  if (already) {
    return { error: "Vous avez déjà publié un avis pour cet achat." };
  }

  await prisma.review.create({
    data: {
      productId: parsed.data.productId,
      userId: user.id,
      orderId: purchased.orderId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      status: "PENDING",
    },
  });

  revalidatePath(`/produits`);
  return { success: "Avis envoyé. Il sera publié après modération." };
}

// ---------------------------------------------------------------------------
// Adresses (§17)
// ---------------------------------------------------------------------------

export async function saveAddressAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = addressSchema.safeParse({
    id: formData.get("id") || undefined,
    label: formData.get("label") || "Domicile",
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    country: formData.get("country") || "Côte d'Ivoire",
    city: formData.get("city"),
    district: formData.get("district"),
    neighborhood: formData.get("neighborhood"),
    street: formData.get("street"),
    additionalInfo: formData.get("additionalInfo"),
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, error: "Adresse invalide." };
  }

  const { id, ...data } = parsed.data;
  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }

  if (id) {
    const owned = await prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!owned) return { error: "Adresse introuvable." };
    await prisma.address.update({ where: { id }, data });
  } else {
    const count = await prisma.address.count({ where: { userId: user.id } });
    await prisma.address.create({ data: { ...data, userId: user.id, isDefault: data.isDefault || count === 0 } });
  }

  revalidatePath("/compte/adresses");
  revalidatePath("/checkout");
  return { success: "Adresse enregistrée." };
}

export async function deleteAddressAction(formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.address.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/compte/adresses");
  return { success: "Adresse supprimée." };
}

export async function setDefaultAddressAction(formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    prisma.address.updateMany({ where: { id, userId: user.id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/compte/adresses");
  return { success: "Adresse par défaut mise à jour." };
}
