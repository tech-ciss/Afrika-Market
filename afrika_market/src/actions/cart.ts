"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import {
  addToCart,
  clearCart,
  getCart,
  mergeCarts,
  removeFromCart,
  resolveCartLines,
  updateCartQuantity,
  type CartLine,
} from "@/lib/services/cart.service";
import { addToCartSchema } from "@/lib/validations/commerce";

export type CartActionResult = {
  ok: boolean;
  error?: string;
  count?: number;
  available?: number;
};

function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

/** Ajout au panier depuis une fiche produit. */
export async function addToCartAction(formData: FormData): Promise<CartActionResult> {
  const user = await getCurrentUser();
  const parsed = addToCartSchema.safeParse({
    productId: formData.get("productId"),
    variantId: formData.get("variantId") || null,
    quantity: formData.get("quantity") || 1,
  });
  if (!parsed.success) {
    return { ok: false, error: "Sélection invalide." };
  }

  if (!user) {
    // Visiteur : le panier reste local (localStorage) — cf. store guest-cart.
    return { ok: false, error: "VISITOR_LOCAL_CART" };
  }

  const result = await addToCart(user.id, parsed.data);
  if (result.error) {
    return { ok: false, error: result.message, available: result.available };
  }
  revalidatePath("/", "layout");
  return { ok: true, count: cartCount(result.lines) };
}

export async function updateCartAction(formData: FormData): Promise<CartActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Connexion requise." };

  const lineId = String(formData.get("lineId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const result = await updateCartQuantity(user.id, lineId, quantity);
  if (result.error) return { ok: false, error: result.message, available: result.available };

  revalidatePath("/panier");
  revalidatePath("/", "layout");
  return { ok: true, count: cartCount(result.lines) };
}

export async function removeFromCartAction(formData: FormData): Promise<CartActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Connexion requise." };

  const result = await removeFromCart(user.id, String(formData.get("lineId") ?? ""));
  revalidatePath("/panier");
  revalidatePath("/", "layout");
  return { ok: true, count: cartCount(result.lines) };
}

export async function clearCartAction(): Promise<CartActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Connexion requise." };
  await clearCart(user.id);
  revalidatePath("/panier");
  revalidatePath("/", "layout");
  return { ok: true, count: 0 };
}

const guestLineSchema = z.array(
  z.object({
    productId: z.string(),
    variantId: z.string().nullable().optional(),
    quantity: z.number().int().min(1).max(99),
  }),
);

/**
 * Fusion du panier invité (localStorage) avec le panier du compte (§10).
 * Appelée juste après une connexion réussie.
 */
export async function syncGuestCartAction(guestItems: unknown): Promise<CartActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Connexion requise." };

  const parsed = guestLineSchema.safeParse(guestItems);
  if (!parsed.success) return { ok: false, error: "Panier local invalide." };

  // Résolution en base : prix, stock et disponibilité sont relus côté serveur.
  const guestLines = await resolveCartLines(parsed.data);
  const current = await getCart(user.id);
  const merged = mergeCarts(
    current,
    guestLines.filter((g) => !current.some((c) => c.productId === g.productId && c.variantId === g.variantId)),
  );
  for (const line of merged.lines) {
    const existing = current.find((c) => c.id === line.id);
    if (existing && existing.quantity !== line.quantity) {
      await updateCartQuantity(user.id, line.id, line.quantity);
    }
  }
  for (const line of guestLines) {
    const target = current.find((c) => c.productId === line.productId && c.variantId === line.variantId);
    if (target) {
      await updateCartQuantity(user.id, target.id, Math.min(target.quantity + line.quantity, target.availableStock));
    } else {
      await addToCart(user.id, { productId: line.productId, variantId: line.variantId, quantity: line.quantity });
    }
  }

  const lines = await getCart(user.id);
  revalidatePath("/", "layout");
  return { ok: true, count: cartCount(lines) };
}

export async function goToCheckoutAction(): Promise<void> {
  const user = await getCurrentUser();
  redirect(user ? "/checkout" : "/connexion?callbackUrl=/checkout");
}
