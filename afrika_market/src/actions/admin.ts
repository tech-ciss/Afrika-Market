"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { recalcProductRating } from "@/lib/services/catalog.service";
import { cancelOrder, refundOrder, transitionOrder } from "@/lib/services/order.service";
import { orderStatusSchema } from "@/lib/validations/enums";
import { categorySchema, deliveryZoneSchema, promoCodeSchema, reviewModerationSchema } from "@/lib/validations/catalog";
import { slugify } from "@/lib/utils";
import type { ActionState } from "@/actions/auth";
import type { OrderStatus, ProducerStatus, UserRole } from "@/lib/validations/enums";

async function requireAdmin() {
  return requireRole("ADMIN", "SUPER_ADMIN");
}

// ---------------------------------------------------------------------------
// Avis (§18)
// ---------------------------------------------------------------------------

export async function moderateReviewAction(formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = reviewModerationSchema.safeParse({
    reviewId: formData.get("reviewId"),
    status: formData.get("status"),
    reply: formData.get("reply") || undefined,
  });
  if (!parsed.success) return { error: "Modération invalide." };

  const review = await prisma.review.findUnique({ where: { id: parsed.data.reviewId } });
  if (!review) return { error: "Avis introuvable." };

  await prisma.review.update({
    where: { id: review.id },
    data: { status: parsed.data.status, reply: parsed.data.reply ?? review.reply },
  });
  await recalcProductRating(review.productId);

  revalidatePath("/admin/avis");
  return { success: `Avis ${parsed.data.status.toLowerCase()}.` };
}

// ---------------------------------------------------------------------------
// Producteurs (§9 — validation)
// ---------------------------------------------------------------------------

export async function setProducerStatusAction(formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ProducerStatus;
  if (!["PENDING", "APPROVED", "SUSPENDED", "REJECTED"].includes(status)) {
    return { error: "Statut invalide." };
  }
  const producer = await prisma.producer.findUnique({ where: { id } });
  if (!producer) return { error: "Producteur introuvable." };

  await prisma.producer.update({ where: { id }, data: { status, isActive: status !== "SUSPENDED" } });
  revalidatePath("/admin/producteurs");
  revalidatePath("/producteurs");
  return { success: `${producer.name} : statut ${status}.` };
}

// ---------------------------------------------------------------------------
// Commandes (§16, §20)
// ---------------------------------------------------------------------------

export async function adminTransitionOrderAction(formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const parsedNext = orderStatusSchema.safeParse(formData.get("next"));
  if (!parsedNext.success) return { error: "Statut de commande invalide." };
  const next: OrderStatus = parsedNext.data;

  try {
    await transitionOrder(orderId, next, "Mise à jour par l'administration");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Transition impossible." };
  }
  revalidatePath("/admin/commandes");
  return { success: `Commande mise à jour : ${next}.` };
}

export async function adminCancelOrderAction(formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const number = String(formData.get("number") ?? "");
  try {
    await cancelOrder(number, "Annulée par l'administration");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Annulation impossible." };
  }
  revalidatePath("/admin/commandes");
  return { success: "Commande annulée, stock restitué." };
}

export async function adminRefundOrderAction(formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const number = String(formData.get("number") ?? "");
  try {
    await refundOrder(number);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Remboursement impossible." };
  }
  revalidatePath("/admin/commandes");
  return { success: "Commande remboursée." };
}

// ---------------------------------------------------------------------------
// Produits (modération) et messages de contact
// ---------------------------------------------------------------------------

/** Masque ou republie un produit (modération des contenus, §20). */
export async function adminToggleProductAction(formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true, slug: true, isActive: true } });
  if (!product) return { error: "Produit introuvable." };

  await prisma.product.update({ where: { id }, data: { isActive: !product.isActive } });
  revalidatePath("/admin/produits");
  revalidatePath("/produits");
  revalidatePath(`/produits/${product.slug}`);
  return { success: product.isActive ? "Produit masqué." : "Produit republié." };
}

export async function markMessageReadAction(formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.contactMessage.updateMany({ where: { id }, data: { isRead: true } });
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { success: "Message marqué comme lu." };
}

// ---------------------------------------------------------------------------
// Catégories, promotions, zones
// ---------------------------------------------------------------------------

export async function saveCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || slugify(String(formData.get("name") ?? "")),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    parentId: formData.get("parentId") || null,
    position: formData.get("position") || 0,
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, error: "Catégorie invalide." };

  const id = String(formData.get("id") ?? "");
  const data = {
    ...parsed.data,
    description: parsed.data.description || null,
    imageUrl: parsed.data.imageUrl || null,
    parentId: parsed.data.parentId || null,
  };

  if (id) {
    await prisma.category.update({ where: { id }, data });
  } else {
    await prisma.category.create({ data });
  }
  revalidatePath("/admin/catalogue");
  revalidatePath("/categories");
  return { success: id ? "Catégorie mise à jour." : "Catégorie créée." };
}

export async function savePromoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = promoCodeSchema.safeParse({
    code: formData.get("code"),
    description: formData.get("description"),
    type: formData.get("type"),
    scope: formData.get("scope"),
    value: formData.get("value"),
    minimumAmount: formData.get("minimumAmount") || 0,
    maximumUses: formData.get("maximumUses") || null,
    maximumUsesPerUser: formData.get("maximumUsesPerUser") || null,
    productId: formData.get("productId") || null,
    categoryId: formData.get("categoryId") || null,
    startsAt: formData.get("startsAt") || new Date().toISOString(),
    endsAt: formData.get("endsAt") || null,
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, error: "Code promo invalide." };

  const data = {
    ...parsed.data,
    maximumUses: parsed.data.maximumUses ? Number(parsed.data.maximumUses) : null,
    maximumUsesPerUser: parsed.data.maximumUsesPerUser ? Number(parsed.data.maximumUsesPerUser) : null,
    endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
    description: parsed.data.description || null,
  };

  const existing = await prisma.promoCode.findUnique({ where: { code: parsed.data.code } });
  if (existing) {
    await prisma.promoCode.update({ where: { id: existing.id }, data });
  } else {
    await prisma.promoCode.create({ data });
  }
  revalidatePath("/admin/promotions");
  return { success: `Code ${parsed.data.code} enregistré.` };
}

export async function togglePromoAction(formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const promo = await prisma.promoCode.findUnique({ where: { id } });
  if (!promo) return { error: "Code introuvable." };
  await prisma.promoCode.update({ where: { id }, data: { isActive: !promo.isActive } });
  revalidatePath("/admin/promotions");
  return { success: promo.isActive ? "Code désactivé." : "Code activé." };
}

export async function saveZoneAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = deliveryZoneSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    countryId: formData.get("countryId"),
    basePrice: formData.get("basePrice"),
    freeFrom: formData.get("freeFrom") || null,
    estimatedDays: formData.get("estimatedDays") || 2,
    allowCashOnDelivery: formData.get("allowCashOnDelivery") === "on",
    isActive: formData.get("isActive") === "on",
    districts: String(formData.get("districts") ?? "")
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, error: "Zone invalide." };

  const data = {
    name: parsed.data.name,
    description: parsed.data.description || null,
    countryId: parsed.data.countryId,
    basePrice: parsed.data.basePrice,
    freeFrom: parsed.data.freeFrom ? Number(parsed.data.freeFrom) : null,
    estimatedDays: parsed.data.estimatedDays,
    allowCashOnDelivery: parsed.data.allowCashOnDelivery,
    isActive: parsed.data.isActive,
  };

  const id = String(formData.get("id") ?? "");
  const zone = id
    ? await prisma.deliveryZone.update({ where: { id }, data })
    : await prisma.deliveryZone.create({ data });

  await prisma.deliveryDistrict.deleteMany({ where: { zoneId: zone.id } });
  if (parsed.data.districts.length > 0) {
    await prisma.deliveryDistrict.createMany({
      data: parsed.data.districts.map((name) => ({ zoneId: zone.id, name })),
    });
  }

  revalidatePath("/admin/zones");
  revalidatePath("/checkout");
  return { success: `Zone ${zone.name} enregistrée.` };
}

// ---------------------------------------------------------------------------
// Newsletter & paramètres
// ---------------------------------------------------------------------------

export async function toggleSubscriberAction(formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const sub = await prisma.newsletterSubscriber.findUnique({ where: { id } });
  if (!sub) return { error: "Abonné introuvable." };
  await prisma.newsletterSubscriber.update({ where: { id }, data: { isActive: !sub.isActive } });
  revalidatePath("/admin/newsletter");
  return { success: sub.isActive ? "Abonnement désactivé." : "Abonnement réactivé." };
}

export async function setUserRoleAction(formData: FormData): Promise<ActionState> {
  const admin = await requireRole("SUPER_ADMIN");
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;
  if (!["CLIENT", "PRODUCER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return { error: "Rôle invalide." };
  }
  if (id === admin.id && role !== "SUPER_ADMIN") {
    return { error: "Vous ne pouvez pas rétrograder votre propre compte." };
  }
  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/utilisateurs");
  return { success: "Rôle mis à jour." };
}

export async function toggleUserActiveAction(formData: FormData): Promise<ActionState> {
  const admin = await requireRole("SUPER_ADMIN", "ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id === admin.id) return { error: "Vous ne pouvez pas désactiver votre propre compte." };
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { error: "Utilisateur introuvable." };
  await prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
  revalidatePath("/admin/utilisateurs");
  return { success: user.isActive ? "Compte désactivé." : "Compte réactivé." };
}

export async function saveSettingAction(formData: FormData): Promise<ActionState> {
  await requireRole("SUPER_ADMIN");
  const key = String(formData.get("key") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  if (!key) return { error: "Clé requise." };
  await prisma.setting.upsert({
    where: { key },
    update: { value, label },
    create: { key, value, label },
  });
  revalidatePath("/admin/parametres");
  return { success: `Paramètre ${key} enregistré.` };
}

export async function saveCountryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("SUPER_ADMIN");
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const currency = String(formData.get("currency") ?? "XOF").trim().toUpperCase();
  if (!name || code.length !== 2) return { error: "Nom et code pays (2 lettres) requis." };

  await prisma.country.upsert({
    where: { code },
    update: { name, currency },
    create: { name, code, currency, isActive: true },
  });
  revalidatePath("/admin/parametres");
  return { success: `Pays ${name} enregistré.` };
}

export async function toggleCountryAction(formData: FormData): Promise<ActionState> {
  await requireRole("SUPER_ADMIN");
  const code = String(formData.get("code") ?? "");
  const country = await prisma.country.findUnique({ where: { code } });
  if (!country) return { error: "Pays introuvable." };
  await prisma.country.update({ where: { code }, data: { isActive: !country.isActive } });
  revalidatePath("/admin/parametres");
  return { success: country.isActive ? "Pays désactivé." : "Pays activé." };
}
