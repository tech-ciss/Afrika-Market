import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Modèle de travail du panier (partagé entre la logique pure et la base)
// ---------------------------------------------------------------------------

export interface CartLine {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  image: string;
  unit: string;
  producerName: string;
  producerId: string;
  unitPrice: number;
  compareAtPrice: number | null;
  /** Stock réellement disponible (variante ou produit). */
  availableStock: number;
  quantity: number;
}

export type CartError = "STOCK_INSUFFISANT" | "PRODUIT_INDISPONIBLE" | "LIGNE_INTROUVABLE" | "QUANTITE_INVALIDE";

export interface CartResult {
  lines: CartLine[];
  error?: CartError;
  message?: string;
  /** Ligne concernée par l'erreur, le cas échéant. */
  lineId?: string;
  /** Stock disponible retourné quand la quantité demandée est trop élevée. */
  available?: number;
}

// ---------------------------------------------------------------------------
// Logique pure du panier — testée par Vitest sans base de données
// ---------------------------------------------------------------------------

/** Fusionne une ligne existante avec une quantité ajoutée, en plafonnant au stock. */
export function addLine(lines: CartLine[], line: Omit<CartLine, "id" | "quantity">, quantity: number, lineId: string): CartResult {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { lines, error: "QUANTITE_INVALIDE", message: "Quantité invalide." };
  }
  const existing = lines.find(
    (l) => l.productId === line.productId && l.variantId === line.variantId,
  );
  if (existing) {
    const next = existing.quantity + quantity;
    if (next > existing.availableStock) {
      return {
        lines,
        error: "STOCK_INSUFFISANT",
        lineId: existing.id,
        available: existing.availableStock,
        message:
          existing.availableStock <= 0
            ? "Ce produit n'est plus disponible."
            : `Stock insuffisant : il ne reste que ${existing.availableStock} unité(s).`,
      };
    }
    return { lines: lines.map((l) => (l.id === existing.id ? { ...l, quantity: next } : l)) };
  }
  if (line.availableStock < 1) {
    return { lines, error: "PRODUIT_INDISPONIBLE", message: "Ce produit n'est plus disponible." };
  }
  if (quantity > line.availableStock) {
    return {
      lines,
      error: "STOCK_INSUFFISANT",
      available: line.availableStock,
      message: `Stock insuffisant : il ne reste que ${line.availableStock} unité(s).`,
    };
  }
  return { lines: [...lines, { ...line, id: lineId, quantity }] };
}

/** Modifie la quantité d'une ligne (0 = suppression). */
export function changeQuantity(lines: CartLine[], lineId: string, quantity: number): CartResult {
  const line = lines.find((l) => l.id === lineId);
  if (!line) return { lines, error: "LIGNE_INTROUVABLE", message: "Ligne introuvable." };
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) {
    return { lines, error: "QUANTITE_INVALIDE", message: "Quantité invalide." };
  }
  if (quantity === 0) return { lines: lines.filter((l) => l.id !== lineId) };
  if (quantity > line.availableStock) {
    return {
      lines,
      error: "STOCK_INSUFFISANT",
      lineId,
      available: line.availableStock,
      message: `Stock insuffisant : il ne reste que ${line.availableStock} unité(s).`,
    };
  }
  return { lines: lines.map((l) => (l.id === lineId ? { ...l, quantity } : l)) };
}

export function removeLine(lines: CartLine[], lineId: string): CartResult {
  if (!lines.some((l) => l.id === lineId)) {
    return { lines, error: "LIGNE_INTROUVABLE", message: "Ligne introuvable." };
  }
  return { lines: lines.filter((l) => l.id !== lineId) };
}

export function clearLines(): CartLine[] {
  return [];
}

export function computeSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

export function computeItemCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

export interface StockIssue {
  lineId: string;
  name: string;
  requested: number;
  available: number;
}

/** Vérifie la disponibilité de toutes les lignes (aucun décrément ici). */
export function validateStock(lines: CartLine[]): { ok: boolean; issues: StockIssue[] } {
  const issues: StockIssue[] = [];
  for (const line of lines) {
    if (line.quantity > line.availableStock) {
      issues.push({
        lineId: line.id,
        name: line.name,
        requested: line.quantity,
        available: line.availableStock,
      });
    }
  }
  return { ok: issues.length === 0, issues };
}

/**
 * Résout des références produit (payload client) en lignes de panier.
 * Prix et stock sont TOUJOURS relus en base — jamais pris au navigateur.
 */
export async function resolveCartLines(
  items: { productId: string; variantId?: string | null; quantity: number }[],
): Promise<CartLine[]> {
  const lines: CartLine[] = [];
  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: productInclude,
    });
    if (!product || !product.isActive) continue;
    const variant = item.variantId ? product.variants.find((v) => v.id === item.variantId) : undefined;
    if (item.variantId && !variant) continue;
    const images = JSON.parse(product.images || "[]") as string[];
    lines.push({
      id: `local-${product.id}-${item.variantId ?? "base"}`,
      productId: product.id,
      variantId: item.variantId ?? null,
      name: variant ? `${product.name} — ${variant.name}` : product.name,
      slug: product.slug,
      image: images[0] ?? "",
      unit: product.unit,
      producerName: product.producer.name,
      producerId: product.producer.id,
      unitPrice: variant?.price ?? product.price,
      compareAtPrice: product.compareAtPrice,
      availableStock: variant ? variant.stock : product.stock,
      quantity: Math.max(1, item.quantity),
    });
  }
  return lines;
}

/** Fusion du panier invité dans le panier connecté (§10 — synchronisation). */
export function mergeCarts(server: CartLine[], guest: CartLine[]): CartResult {
  let lines = server.map((l) => ({ ...l }));
  for (const g of guest) {
    const target = lines.find((l) => l.productId === g.productId && l.variantId === g.variantId);
    if (target) {
      const next = Math.min(target.quantity + g.quantity, target.availableStock);
      lines = lines.map((l) => (l.id === target.id ? { ...l, quantity: next } : l));
    } else if (g.availableStock > 0) {
      lines.push({ ...g, quantity: Math.min(g.quantity, g.availableStock) });
    }
  }
  return { lines };
}

// ---------------------------------------------------------------------------
// Opérations persistantes (client connecté)
// ---------------------------------------------------------------------------

type ProductWithRelations = {
  id: string;
  name: string;
  slug: string;
  images: string;
  unit: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isActive: boolean;
  producer: { id: string; name: string };
  variants: { id: string; price: number; stock: number; name: string; sku: string }[];
};

function toLine(item: {
  id: string;
  quantity: number;
  variantId: string | null;
  product: ProductWithRelations;
}): CartLine {
  const variant = item.variantId ? item.product.variants.find((v) => v.id === item.variantId) : undefined;
  const images = JSON.parse(item.product.images || "[]") as string[];
  return {
    id: item.id,
    productId: item.product.id,
    variantId: item.variantId,
    name: item.variantId ? `${item.product.name} — ${variant?.name ?? ""}`.trim() : item.product.name,
    slug: item.product.slug,
    image: images[0] ?? "",
    unit: item.product.unit,
    producerName: item.product.producer.name,
    producerId: item.product.producer.id,
    unitPrice: variant?.price ?? item.product.price,
    compareAtPrice: item.product.compareAtPrice,
    availableStock: variant ? variant.stock : item.product.stock,
    quantity: item.quantity,
  };
}

const productInclude = {
  producer: { select: { id: true, name: true } },
  variants: { select: { id: true, price: true, stock: true, name: true, sku: true } },
} as const;

/** Panier persistant d'un client connecté (§10). */
export async function getCart(userId: string): Promise<CartLine[]> {
  const items = await prisma.cartItem.findMany({
    where: { userId, product: { isActive: true } },
    include: { product: { include: productInclude } },
    orderBy: { createdAt: "asc" },
  });
  return items.map((i) => toLine(i as never));
}

export async function addToCart(
  userId: string,
  input: { productId: string; variantId?: string | null; quantity: number },
): Promise<CartResult> {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    include: productInclude,
  });
  if (!product || !product.isActive) {
    return { lines: [], error: "PRODUIT_INDISPONIBLE", message: "Ce produit n'existe plus." };
  }

  const current = await getCart(userId);
  const draft: Omit<CartLine, "id" | "quantity"> = {
    productId: product.id,
    variantId: input.variantId ?? null,
    name: product.name,
    slug: product.slug,
    image: (JSON.parse(product.images || "[]") as string[])[0] ?? "",
    unit: product.unit,
    producerName: product.producer.name,
    producerId: product.producer.id,
    unitPrice: input.variantId
      ? (product.variants.find((v) => v.id === input.variantId)?.price ?? product.price)
      : product.price,
    compareAtPrice: product.compareAtPrice,
    availableStock: input.variantId
      ? (product.variants.find((v) => v.id === input.variantId)?.stock ?? product.stock)
      : product.stock,
  };

  const result = addLine(current, draft, input.quantity, `tmp-${product.id}`);
  if (result.error) return result;

  const existing = await prisma.cartItem.findFirst({
    where: { userId, productId: input.productId, variantId: input.variantId ?? null },
  });
  const finalQuantity = result.lines.find(
    (l) => l.productId === input.productId && l.variantId === (input.variantId ?? null),
  )!.quantity;

  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: finalQuantity } });
  } else {
    await prisma.cartItem.create({
      data: { userId, productId: input.productId, variantId: input.variantId ?? null, quantity: finalQuantity },
    });
  }
  return { lines: await getCart(userId) };
}

export async function updateCartQuantity(userId: string, lineId: string, quantity: number): Promise<CartResult> {
  const item = await prisma.cartItem.findFirst({ where: { id: lineId, userId } });
  if (!item) return { lines: await getCart(userId), error: "LIGNE_INTROUVABLE", message: "Ligne introuvable." };

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    return { lines: await getCart(userId) };
  }

  const lines = await getCart(userId);
  const result = changeQuantity(lines, lineId, quantity);
  if (result.error) return { ...result, lines };

  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  return { lines: await getCart(userId) };
}

export async function removeFromCart(userId: string, lineId: string): Promise<CartResult> {
  await prisma.cartItem.deleteMany({ where: { id: lineId, userId } });
  return { lines: await getCart(userId) };
}

export async function clearCart(userId: string): Promise<void> {
  await prisma.cartItem.deleteMany({ where: { userId } });
}

/** Fusionne le panier local (invité) au panier du compte à la connexion. */
export async function mergeGuestCart(userId: string, guestLines: CartLine[]): Promise<CartLine[]> {
  const server = await getCart(userId);
  const merged = mergeCarts(server, guestLines);
  for (const line of merged.lines) {
    const existing = server.find((s) => s.id === line.id);
    if (existing && existing.quantity !== line.quantity) {
      await prisma.cartItem.update({ where: { id: line.id }, data: { quantity: line.quantity } });
    } else if (!existing) {
      const already = await prisma.cartItem.findFirst({
        where: { userId, productId: line.productId, variantId: line.variantId },
      });
      if (already) {
        await prisma.cartItem.update({ where: { id: already.id }, data: { quantity: line.quantity } });
      } else {
        await prisma.cartItem.create({
          data: { userId, productId: line.productId, variantId: line.variantId, quantity: line.quantity },
        });
      }
    }
  }
  return getCart(userId);
}
