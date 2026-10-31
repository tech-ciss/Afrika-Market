import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Gestion du stock (§31) — aucun décrément à partir d'une valeur client
// ---------------------------------------------------------------------------

export interface StockRequest {
  productId: string;
  variantId: string | null;
  quantity: number;
}

export interface StockCheck {
  ok: boolean;
  issues: { productId: string; name: string; requested: number; available: number }[];
}

/** Vérifie la disponibilité sans toucher au stock (phase de lecture du checkout). */
export async function checkStock(requests: StockRequest[]): Promise<StockCheck> {
  const issues: StockCheck["issues"] = [];
  for (const req of requests) {
    const product = await prisma.product.findUnique({
      where: { id: req.productId },
      select: { name: true, stock: true, isActive: true, variants: { select: { id: true, stock: true } } },
    });
    if (!product || !product.isActive) {
      issues.push({ productId: req.productId, name: "Produit", requested: req.quantity, available: 0 });
      continue;
    }
    const available = req.variantId
      ? (product.variants.find((v) => v.id === req.variantId)?.stock ?? 0)
      : product.stock;
    if (available < req.quantity) {
      issues.push({ productId: req.productId, name: product.name, requested: req.quantity, available });
    }
  }
  return { ok: issues.length === 0, issues };
}

/**
 * Décrémente le stock de façon atomique.
 * `updateMany` avec la condition `stock >= quantité` garantit qu'une vente
 * simultanée ne peut pas passer sous zéro : si aucune ligne n'est mise à jour,
 * l'opération échoue et la transaction est annulée (pas de sur-commande).
 */
export async function decrementStock(
  tx: Prisma.TransactionClient,
  requests: StockRequest[],
): Promise<void> {
  for (const req of requests) {
    if (req.variantId) {
      const updated = await tx.productVariant.updateMany({
        where: { id: req.variantId, stock: { gte: req.quantity } },
        data: { stock: { decrement: req.quantity } },
      });
      if (updated.count === 0) {
        throw new StockError(req.productId, req.variantId, req.quantity);
      }
    } else {
      const updated = await tx.product.updateMany({
        where: { id: req.productId, stock: { gte: req.quantity } },
        data: {
          stock: { decrement: req.quantity },
          salesCount: { increment: req.quantity },
        },
      });
      if (updated.count === 0) {
        throw new StockError(req.productId, null, req.quantity);
      }
    }
  }
}

/** Remet le stock (annulation, remboursement). Idempotent. */
export async function restoreStock(
  tx: Prisma.TransactionClient,
  requests: StockRequest[],
): Promise<void> {
  for (const req of requests) {
    if (req.variantId) {
      await tx.productVariant.update({
        where: { id: req.variantId },
        data: { stock: { increment: req.quantity } },
      });
    } else {
      await tx.product.update({
        where: { id: req.productId },
        data: { stock: { increment: req.quantity }, salesCount: { decrement: req.quantity } },
      });
    }
  }
}

export class StockError extends Error {
  code = "STOCK_INSUFFISANT" as const;
  constructor(
    public productId: string,
    public variantId: string | null,
    public requested: number,
  ) {
    super("Stock insuffisant au moment de la validation de la commande.");
    this.name = "StockError";
  }
}

/** Produits en rupture ou sous leur seuil d'alerte (back-office, §20). */
export async function getStockAlerts(producerId?: string) {
  const candidates = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(producerId ? { producerId } : {}),
      stock: { lte: 200 }, // seuil large : filtrage fin ci-dessous sur lowStockThreshold
    },
    include: { producer: { select: { name: true } }, category: { select: { name: true } } },
    orderBy: { stock: "asc" },
    take: 500,
  });
  return candidates.filter((p) => p.stock <= p.lowStockThreshold);
}
