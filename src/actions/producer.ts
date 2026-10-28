"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { productSchema, producerProfileSchema } from "@/lib/validations/catalog";
import { transitionOrder } from "@/lib/services/order.service";
import { slugify } from "@/lib/utils";
import type { ActionState } from "@/actions/auth";
import { orderStatusSchema, type OrderStatus } from "@/lib/validations/enums";

/** Charge le producteur rattaché au compte connecté (§9 — cloisonnement). */
async function requireProducer() {
  const user = await requireRole("PRODUCER", "ADMIN", "SUPER_ADMIN");
  const producer = await prisma.producer.findUnique({ where: { userId: user.id } });
  if (!producer) throw new Error("Compte producteur introuvable.");
  return { user, producer };
}

/** Vérifie qu'un produit appartient bien au producteur connecté. */
async function ownedProduct(productId: string) {
  const { producer } = await requireProducer();
  const product = await prisma.product.findFirst({ where: { id: productId, producerId: producer.id } });
  if (!product) throw new Error("Produit introuvable.");
  return { producer, product };
}

export async function saveProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { producer } = await requireProducer();

  const characteristics = (() => {
    try {
      const parsed = JSON.parse(String(formData.get("characteristics") ?? "[]"));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || slugify(String(formData.get("name") ?? "")),
    categoryId: formData.get("categoryId"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") ? Number(formData.get("compareAtPrice")) : null,
    stock: formData.get("stock"),
    lowStockThreshold: formData.get("lowStockThreshold") || 5,
    unit: formData.get("unit"),
    weight: formData.get("weight") ? Number(formData.get("weight")) : null,
    sku: formData.get("sku"),
    tags: formData.get("tags"),
    images: String(formData.get("imageUrl") ?? "").trim() ? [String(formData.get("imageUrl")).trim()] : [],
    characteristics,
    countryId: formData.get("countryId"),
    region: formData.get("region"),
    city: formData.get("city"),
    originMethod: formData.get("originMethod"),
    harvestPeriod: formData.get("harvestPeriod"),
    conservation: formData.get("conservation"),
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, error: "Veuillez corriger le formulaire." };
  }

  const data = {
    ...parsed.data,
    compareAtPrice: parsed.data.compareAtPrice || null,
    tags: parsed.data.tags ?? "",
    region: parsed.data.region || null,
    city: parsed.data.city || null,
    originMethod: parsed.data.originMethod || null,
    harvestPeriod: parsed.data.harvestPeriod || null,
    conservation: parsed.data.conservation || null,
    sku: parsed.data.sku || null,
    images: JSON.stringify(parsed.data.images),
    characteristics: JSON.stringify(parsed.data.characteristics),
  };

  const id = String(formData.get("id") ?? "");
  if (id) {
    const { product } = await ownedProduct(id);
    await prisma.product.update({ where: { id: product.id }, data });
  } else {
    const duplicate = await prisma.product.findFirst({ where: { slug: data.slug } });
    await prisma.product.create({
      data: { ...data, slug: duplicate ? `${data.slug}-${Date.now().toString().slice(-4)}` : data.slug, producerId: producer.id },
    });
  }

  revalidatePath("/vendeur/produits");
  revalidatePath("/produits");
  return { success: id ? "Produit mis à jour." : "Produit publié." };
}

export async function toggleProductAction(formData: FormData): Promise<ActionState> {
  const { product } = await ownedProduct(String(formData.get("id") ?? ""));
  await prisma.product.update({ where: { id: product.id }, data: { isActive: !product.isActive } });
  revalidatePath("/vendeur/produits");
  revalidatePath("/produits");
  return { success: product.isActive ? "Produit désactivé." : "Produit activé." };
}

export async function updateStockAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { product } = await ownedProduct(String(formData.get("id") ?? ""));
  const stock = Number(formData.get("stock"));
  if (!Number.isInteger(stock) || stock < 0) {
    return { error: "Stock invalide." };
  }
  await prisma.product.update({ where: { id: product.id }, data: { stock } });
  revalidatePath("/vendeur/produits");
  return { success: `Stock mis à jour : ${stock} unité(s).` };
}

export async function updateProducerProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { producer } = await requireProducer();

  const parsed = producerProfileSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    story: formData.get("story"),
    countryId: formData.get("countryId"),
    region: formData.get("region"),
    city: formData.get("city"),
    specialties: formData.get("specialties"),
    certifications: formData.get("certifications"),
    logoUrl: formData.get("logoUrl"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, error: "Veuillez corriger le formulaire." };
  }

  await prisma.producer.update({
    where: { id: producer.id },
    data: {
      ...parsed.data,
      story: parsed.data.story || null,
      logoUrl: parsed.data.logoUrl || null,
      specialties: parsed.data.specialties ?? "",
      certifications: parsed.data.certifications ?? "",
    },
  });

  revalidatePath("/vendeur/profil");
  revalidatePath("/producteurs");
  return { success: "Profil producteur mis à jour." };
}

/** Le producteur fait avancer la préparation de ses commandes (§14 / §16). */
const PRODUCER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PAID: ["CONFIRMED", "PREPARING"],
  CONFIRMED: ["PREPARING"],
  PREPARING: ["READY_FOR_DELIVERY"],
  READY_FOR_DELIVERY: ["IN_TRANSIT"],
};

export async function advanceOrderAction(formData: FormData): Promise<ActionState> {
  const { producer } = await requireProducer();
  const orderId = String(formData.get("orderId") ?? "");
  const parsedNext = orderStatusSchema.safeParse(formData.get("next"));
  if (!parsedNext.success) return { error: "Statut de commande invalide." };
  const next: OrderStatus = parsedNext.data;

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { error: "Commande introuvable." };

  // Cloisonnement : un producteur ne touche qu'à ses propres lignes de commande.
  const mine = order.items.some((i) => i.producerId === producer.id);
  if (!mine) return { error: "Commande non autorisée." };

  const allowed = PRODUCER_TRANSITIONS[order.status as OrderStatus] ?? [];
  if (!allowed.includes(next)) {
    return { error: `Action impossible depuis le statut « ${order.status} ».` };
  }

  await transitionOrder(orderId, next, `Mise à jour par ${producer.name}`);
  revalidatePath("/vendeur/commandes");
  return { success: "Statut de commande mis à jour." };
}
