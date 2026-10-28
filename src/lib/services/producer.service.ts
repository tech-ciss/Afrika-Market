import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Producteurs (module B)
// ---------------------------------------------------------------------------

export async function getApprovedProducers() {
  return prisma.producer.findMany({
    where: { status: "APPROVED", isActive: true },
    include: { country: { select: { name: true, code: true } }, _count: { select: { products: { where: { isActive: true } } } } },
    orderBy: { name: "asc" },
  });
}

export async function getProducerBySlug(slug: string) {
  return prisma.producer.findUnique({
    where: { slug },
    include: {
      country: true,
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });
}

/** Statistiques publiques de la fiche producteur (bonus 6 simplifié). */
export async function getProducerPublicStats(producerId: string) {
  const [products, sales, rating] = await Promise.all([
    prisma.product.count({ where: { producerId, isActive: true } }),
    prisma.product.aggregate({ where: { producerId, isActive: true }, _sum: { salesCount: true } }),
    prisma.review.aggregate({
      where: { status: "APPROVED", product: { producerId } },
      _avg: { rating: true },
      _count: true,
    }),
  ]);
  return {
    productCount: products,
    unitsSold: sales._sum.salesCount ?? 0,
    averageRating: Number((rating._avg.rating ?? 0).toFixed(1)),
    reviewCount: rating._count,
  };
}

/** Statistiques privées de l'espace vendeur (§9 — espace privé). */
export async function getProducerDashboard(producerId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [products, activeProducts, lowStock, revenue, monthRevenue, orders, pendingOrders, topProducts] =
    await Promise.all([
      prisma.product.count({ where: { producerId } }),
      prisma.product.count({ where: { producerId, isActive: true } }),
      prisma.product.findMany({
        where: { producerId, isActive: true, stock: { lte: 5 } },
        select: { id: true, name: true, slug: true, stock: true, lowStockThreshold: true },
        orderBy: { stock: "asc" },
        take: 10,
      }),
      prisma.orderItem.aggregate({
        where: { producerId, order: { isPaid: true, status: { notIn: ["CANCELLED", "REFUNDED"] } } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.orderItem.aggregate({
        where: {
          producerId,
          order: { isPaid: true, status: { notIn: ["CANCELLED", "REFUNDED"] }, createdAt: { gte: startOfMonth } },
        },
        _sum: { total: true },
      }),
      prisma.orderItem.findMany({
        where: { producerId },
        select: { orderId: true, order: { select: { number: true, status: true, createdAt: true } } },
        distinct: ["orderId"],
      }),
      prisma.orderItem.findMany({
        where: { producerId, order: { status: { in: ["PAID", "CONFIRMED", "PREPARING"] } } },
        select: { orderId: true, order: { select: { number: true, createdAt: true, total: true } } },
        distinct: ["orderId"],
        orderBy: { order: { createdAt: "desc" } },
        take: 8,
      }),
      prisma.product.findMany({
        where: { producerId },
        select: { id: true, name: true, slug: true, salesCount: true, stock: true, price: true },
        orderBy: { salesCount: "desc" },
        take: 5,
      }),
    ]);

  return {
    productCount: products,
    activeProductCount: activeProducts,
    lowStock,
    revenue: revenue._sum.total ?? 0,
    monthRevenue: monthRevenue._sum.total ?? 0,
    orderCount: orders.length,
    unitCount: revenue._count,
    pendingOrders,
    topProducts,
  };
}

export async function getProducerByUserId(userId: string) {
  return prisma.producer.findUnique({ where: { userId } });
}
