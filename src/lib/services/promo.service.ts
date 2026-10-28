import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Promotions — logique pure testable (§19 et §33)
// ---------------------------------------------------------------------------

export interface PromoRecord {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  scope: "GLOBAL" | "PRODUCT" | "CATEGORY";
  value: number;
  minimumAmount: number;
  maximumUses: number | null;
  maximumUsesPerUser: number | null;
  startsAt: Date;
  endsAt: Date | null;
  isActive: boolean;
  productId: string | null;
  categoryId: string | null;
}

export interface PromoContext {
  now?: Date;
  /** Sous-total éligible (avant remise). */
  subtotal: number;
  /** Identifiants produits / catégories présents dans le panier. */
  productIds: string[];
  categoryIds: string[];
  /** Nombre d'utilisations déjà enregistrées (toutes et par utilisateur). */
  usesTotal: number;
  usesByUser: number;
}

export type PromoRejectionReason =
  | "INCONNU"
  | "INACTIF"
  | "NON_DEBUTE"
  | "EXPIRE"
  | "MONTANT_MINIMUM"
  | "UTILISATIONS_MAX"
  | "UTILISATIONS_UTILISATEUR_MAX"
  | "NON_ELIGIBLE";

export interface PromoResult {
  ok: boolean;
  reason?: PromoRejectionReason;
  message?: string;
  /** Montant de la remise en FCFA (0 pour un code livraison offerte). */
  discount: number;
  /** true si le code rend la livraison gratuite. */
  freeShipping: boolean;
}

export const PROMO_MESSAGES: Record<PromoRejectionReason, string> = {
  INCONNU: "Ce code promotionnel n'existe pas.",
  INACTIF: "Ce code promotionnel n'est plus actif.",
  NON_DEBUTE: "Ce code promotionnel n'est pas encore valide.",
  EXPIRE: "Ce code promotionnel a expiré.",
  MONTANT_MINIMUM: "Le montant minimum du panier n'est pas atteint.",
  UTILISATIONS_MAX: "Ce code a déjà été utilisé le nombre maximum de fois.",
  UTILISATIONS_UTILISATEUR_MAX: "Vous avez déjà utilisé ce code promotionnel.",
  NON_ELIGIBLE: "Ce code ne s'applique pas aux produits de votre panier.",
};

/** Évalue un code promo. Aucun accès base : entièrement déterministe. */
export function validatePromo(promo: PromoRecord | null, ctx: PromoContext): PromoResult {
  const fail = (reason: PromoRejectionReason): PromoResult => ({
    ok: false,
    reason,
    message: PROMO_MESSAGES[reason],
    discount: 0,
    freeShipping: false,
  });

  if (!promo) return fail("INCONNU");
  if (!promo.isActive) return fail("INACTIF");

  const now = ctx.now ?? new Date();
  if (now < promo.startsAt) return fail("NON_DEBUTE");
  if (promo.endsAt && now > promo.endsAt) return fail("EXPIRE");
  if (promo.minimumAmount > 0 && ctx.subtotal < promo.minimumAmount) return fail("MONTANT_MINIMUM");
  if (promo.maximumUses !== null && ctx.usesTotal >= promo.maximumUses) return fail("UTILISATIONS_MAX");
  if (promo.maximumUsesPerUser !== null && ctx.usesByUser >= promo.maximumUsesPerUser) {
    return fail("UTILISATIONS_UTILISATEUR_MAX");
  }

  // Portée : le code ne s'applique que si le panier contient un produit éligible.
  if (promo.scope === "PRODUCT" && (!promo.productId || !ctx.productIds.includes(promo.productId))) {
    return fail("NON_ELIGIBLE");
  }
  if (promo.scope === "CATEGORY" && (!promo.categoryId || !ctx.categoryIds.includes(promo.categoryId))) {
    return fail("NON_ELIGIBLE");
  }

  if (promo.type === "FREE_SHIPPING") {
    return { ok: true, discount: 0, freeShipping: true };
  }

  let discount: number;
  if (promo.type === "PERCENTAGE") {
    const rate = Math.min(Math.max(promo.value, 0), 100);
    discount = Math.round((ctx.subtotal * rate) / 100);
  } else {
    discount = Math.min(promo.value, ctx.subtotal);
  }
  discount = Math.max(0, Math.min(discount, ctx.subtotal));

  return { ok: true, discount, freeShipping: false };
}

/**
 * Statuts qui ne consomment PAS un code : une commande annulée ou remboursée le libère.
 * Une commande « en attente de paiement » compte, sinon un code à usage limité pourrait
 * être utilisé par de nombreuses commandes simultanées avant le premier paiement.
 * (Les commandes impayées expirent automatiquement, cf. expireUnpaidOrders.)
 */
export const PROMO_RELEASING_STATUSES = ["CANCELLED", "REFUNDED"];

/** Filtre « même client » : compte connecté, sinon même e-mail pour un invité. */
export function promoCustomerFilter(userId?: string | null, email?: string | null) {
  if (userId) return { userId };
  if (email) return { userId: null, email: email.trim().toLowerCase() };
  return null;
}

/** Chargement du code + calcul des utilisations, puis validation. */
export async function evaluatePromoCode(
  code: string,
  input: {
    subtotal: number;
    productIds: string[];
    categoryIds: string[];
    userId?: string | null;
    /** E-mail du client : limite aussi les invités (maximumUsesPerUser). */
    email?: string | null;
  },
): Promise<PromoResult> {
  const normalized = code.trim().toUpperCase();
  const promo = await prisma.promoCode.findUnique({ where: { code: normalized } });

  const usesTotal = promo
    ? await prisma.order.count({
        where: { promoCodeId: promo.id, status: { notIn: PROMO_RELEASING_STATUSES } },
      })
    : 0;

  const customer = promoCustomerFilter(input.userId, input.email);
  const usesByUser =
    promo && customer
      ? await prisma.order.count({
          where: {
            promoCodeId: promo.id,
            ...customer,
            status: { notIn: PROMO_RELEASING_STATUSES },
          },
        })
      : 0;

  const record = promo
    ? ({
        id: promo.id,
        code: promo.code,
        description: promo.description,
        type: promo.type as PromoRecord["type"],
        scope: promo.scope as PromoRecord["scope"],
        value: promo.value,
        minimumAmount: promo.minimumAmount,
        maximumUses: promo.maximumUses,
        maximumUsesPerUser: promo.maximumUsesPerUser,
        startsAt: promo.startsAt,
        endsAt: promo.endsAt,
        isActive: promo.isActive,
        productId: promo.productId,
        categoryId: promo.categoryId,
      } satisfies PromoRecord)
    : null;

  return validatePromo(record, {
    subtotal: input.subtotal,
    productIds: input.productIds,
    categoryIds: input.categoryIds,
    usesTotal,
    usesByUser,
  });
}
