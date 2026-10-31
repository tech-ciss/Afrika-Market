"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { rateLimitByIp, LIMITS } from "@/lib/security/rate-limit";
import { isSandboxEnabled } from "@/lib/services/payment.service";
import { createOrder, type CreateOrderResult } from "@/lib/services/order.service";
import { computeSubtotal, getCart, resolveCartLines, type CartLine } from "@/lib/services/cart.service";
import { computeShippingFee, getActiveZones } from "@/lib/services/delivery.service";
import { evaluatePromoCode } from "@/lib/services/promo.service";
import { checkoutSchema } from "@/lib/validations/commerce";

export type QuoteState = {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  freeReason?: string;
  promoMessage?: string;
  promoOk?: boolean;
  deliveryDays?: number;
};

const guestItemsSchema = z.array(
  z.object({
    productId: z.string().min(1),
    variantId: z.string().nullable().optional(),
    quantity: z.coerce.number().int().min(1).max(99),
  }),
);

/** Parse défensif : un champ JSON malformé ne doit jamais provoquer une erreur 500. */
function parseGuestItems(raw: FormDataEntryValue | null) {
  try {
    return guestItemsSchema.safeParse(JSON.parse(String(raw ?? "[]")));
  } catch {
    return { success: false as const };
  }
}

/** Chargement des lignes : panier serveur si connecté, références reçues sinon. */
async function loadLines(userId: string | null, rawItems: FormDataEntryValue | null): Promise<CartLine[]> {
  if (userId) return getCart(userId);
  const parsed = parseGuestItems(rawItems);
  if (!parsed.success) return [];
  return resolveCartLines(parsed.data);
}

/**
 * Devis côté serveur (§10 et §15) : sous-total, livraison, remise, total.
 * Le client n'envoie jamais de montant, seulement des références.
 */
export async function quoteOrderAction(formData: FormData): Promise<QuoteState> {
  const user = await getCurrentUser();
  const lines = await loadLines(user?.id ?? null, formData.get("items"));
  const subtotal = computeSubtotal(lines);

  const zones = await getActiveZones();
  const zone = zones.find((z) => z.id === String(formData.get("zoneId") ?? "")) ?? null;
  const method = (String(formData.get("deliveryMethod") ?? "HOME") as never) || "HOME";
  const promoCode = String(formData.get("promoCode") ?? "").trim();

  let discount = 0;
  let freeShipping = false;
  let promoMessage: string | undefined;
  let promoOk: boolean | undefined;

  // Limite les essais de codes promo (évite l'énumération de codes).
  const promoLimited = promoCode ? !(await rateLimitByIp("promo", LIMITS.promo)).ok : false;

  if (promoCode && promoLimited) {
    promoOk = false;
    promoMessage = "Trop d'essais, patientez une minute avant de réessayer.";
  } else if (promoCode) {
    // Mêmes entrées que createOrder, sinon une promo « par catégorie » afficherait
    // au devis un montant différent de celui de la commande.
    const productIds = lines.map((l) => l.productId);
    const categories = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { categoryId: true },
    });
    const result = await evaluatePromoCode(promoCode, {
      subtotal,
      productIds,
      categoryIds: Array.from(new Set(categories.map((c) => c.categoryId))),
      userId: user?.id ?? null,
      email: String(formData.get("email") ?? "").trim().toLowerCase() || null,
    });
    promoOk = result.ok;
    promoMessage = result.message ?? (result.ok ? `Code ${promoCode} appliqué.` : undefined);
    if (result.ok) {
      discount = result.discount;
      freeShipping = result.freeShipping;
    }
  }

  const shipping = computeShippingFee({
    zone,
    subtotal,
    method,
    freeShippingPromo: freeShipping,
  });

  return {
    subtotal,
    shipping: shipping.fee,
    discount,
    total: Math.max(0, subtotal - discount) + shipping.fee,
    freeReason: shipping.freeReason,
    promoMessage,
    promoOk,
    deliveryDays: shipping.estimatedDays,
  };
}

export type PlaceOrderState = (CreateOrderResult & { fieldErrors?: Record<string, string[]> }) | null;

/** Création de la commande (§11 checkout, §16 commandes, §31 stock). */
export async function placeOrderAction(
  _prev: PlaceOrderState,
  formData: FormData,
): Promise<PlaceOrderState> {
  const user = await getCurrentUser();

  const parsed = checkoutSchema.safeParse({
    email: formData.get("email"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    street: formData.get("street"),
    city: formData.get("city"),
    district: formData.get("district"),
    neighborhood: formData.get("neighborhood"),
    additionalInfo: formData.get("additionalInfo"),
    zoneId: formData.get("zoneId"),
    deliveryMethod: formData.get("deliveryMethod"),
    paymentMethod: formData.get("paymentMethod"),
    addressId: formData.get("addressId") || null,
    note: formData.get("note"),
    promoCode: formData.get("promoCode") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Veuillez vérifier vos informations de livraison.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let items: { productId: string; variantId?: string | null; quantity: number }[] | undefined;
  if (!user) {
    const parsedItems = parseGuestItems(formData.get("items"));
    if (!parsedItems.success || parsedItems.data.length === 0) {
      return { ok: false, error: "Votre panier est vide.", field: "cart" };
    }
    items = parsedItems.data;
  }

  const result = await createOrder({ userId: user?.id ?? null, items, input: parsed.data });

  if (!result.ok) return result;

  revalidatePath("/", "layout");
  revalidatePath("/compte/commandes");

  const params = new URLSearchParams({ num: result.number });
  if (result.guestToken) params.set("t", result.guestToken);

  // Paiement en ligne non encore réglé : on envoie le client vers la page du prestataire
  // (page de simulation en mode démo). Le paiement à la livraison va directement à la confirmation.
  if (!result.isPaid && result.providerRef && isSandboxEnabled()) {
    const pay = new URLSearchParams();
    if (result.guestToken) pay.set("t", result.guestToken);
    const qs = pay.toString();
    redirect(`/paiement/${result.providerRef}${qs ? `?${qs}` : ""}`);
  }
  redirect(`/confirmation?${params.toString()}`);
}
