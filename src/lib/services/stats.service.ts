import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Statistiques — dashboard administrateur (§20 et §21)
// ---------------------------------------------------------------------------

function startOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number): Date {
  const d = startOfDay();
  d.setDate(d.getDate() - n);
  return d;
}

export async function getAdminDashboard() {
  const today = startOfDay();
  const week = daysAgo(7);
  const month = daysAgo(30);

  const paidFilter = { isPaid: true, status: { notIn: ["CANCELLED", "REFUNDED"] } };

  const [
    todayOrders,
    weekOrders,
    monthOrders,
    allOrders,
    ordersByStatus,
    customers,
    monthCustomers,
    pendingReviews,
    failedPayments,
    activeDeliveries,
    pendingProducers,
    lowStockProducts,
    topProducts,
    topProducers,
    paymentMethods,
    zones,
    newsletterCount,
  ] = await Promise.all([
    prisma.order.aggregate({ where: { ...paidFilter, createdAt: { gte: today } }, _sum: { total: true }, _count: true }),
    prisma.order.aggregate({ where: { ...paidFilter, createdAt: { gte: week } }, _sum: { total: true }, _count: true }),
    prisma.order.aggregate({ where: { ...paidFilter, createdAt: { gte: month } }, _sum: { total: true }, _count: true }),
    prisma.order.aggregate({ where: paidFilter, _sum: { total: true }, _count: true }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.user.count({ where: { role: "CLIENT", createdAt: { gte: month } } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
    prisma.delivery.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY", "IN_TRANSIT"] } } }),
    prisma.producer.count({ where: { status: "PENDING" } }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: 5 } },
      select: { id: true, name: true, slug: true, stock: true, lowStockThreshold: true, producer: { select: { name: true } } },
      orderBy: { stock: "asc" },
      take: 8,
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: paidFilter },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 6,
    }),
    prisma.orderItem.groupBy({
      by: ["producerId"],
      where: { producerId: { not: null }, order: paidFilter },
      _sum: { total: true, quantity: true },
      orderBy: { _sum: { total: "desc" } },
      take: 6,
    }),
    prisma.order.groupBy({ by: ["paymentMethod"], _count: true }),
    prisma.delivery.groupBy({ by: ["zoneId"], _count: true, orderBy: { _count: { zoneId: "desc" } }, take: 6 }),
    prisma.newsletterSubscriber.count({ where: { isActive: true } }),
  ]);

  const cancelled = ordersByStatus.find((s) => s.status === "CANCELLED")?._count ?? 0;
  const totalOrders = ordersByStatus.reduce((sum, s) => sum + s._count, 0);

  const topProductIds = topProducts.map((p) => p.productId).filter(Boolean) as string[];
  const topProductRows = topProductIds.length
    ? await prisma.product.findMany({
        where: { id: { in: topProductIds } },
        select: { id: true, name: true, slug: true, price: true, images: true },
      })
    : [];
  const productById = new Map(topProductRows.map((p) => [p.id, p]));

  const topProducerIds = topProducers.map((p) => p.producerId).filter(Boolean) as string[];
  const topProducerRows = topProducerIds.length
    ? await prisma.producer.findMany({ where: { id: { in: topProducerIds } }, select: { id: true, name: true, slug: true } })
    : [];
  const producerById = new Map(topProducerRows.map((p) => [p.id, p]));

  const zoneIds = zones.map((z) => z.zoneId).filter(Boolean) as string[];
  const zoneRows = zoneIds.length
    ? await prisma.deliveryZone.findMany({ where: { id: { in: zoneIds } }, select: { id: true, name: true } })
    : [];
  const zoneById = new Map(zoneRows.map((z) => [z.id, z.name]));

  const revenue = (agg: { _sum: { total: number | null }; _count: number }) => ({
    revenue: agg._sum.total ?? 0,
    orders: agg._count,
    averageBasket: agg._count > 0 ? Math.round((agg._sum.total ?? 0) / agg._count) : 0,
  });

  return {
    today: revenue(todayOrders),
    week: revenue(weekOrders),
    month: revenue(monthOrders),
    all: revenue(allOrders),
    cancelledRate: totalOrders > 0 ? Math.round((cancelled / totalOrders) * 100) : 0,
    statusBreakdown: ordersByStatus.map((s) => ({ status: s.status, count: s._count })),
    customers: { total: customers, newThisMonth: monthCustomers },
    alerts: {
      pendingReviews,
      failedPayments,
      activeDeliveries,
      pendingProducers,
      lowStockCount: lowStockProducts.length,
      newsletterCount,
    },
    lowStockProducts,
    topProducts: topProducts
      .map((p) => ({
        product: p.productId ? productById.get(p.productId) : undefined,
        quantity: p._sum.quantity ?? 0,
        revenue: p._sum.total ?? 0,
      }))
      .filter((p) => p.product),
    topProducers: topProducers
      .map((p) => ({
        producer: p.producerId ? producerById.get(p.producerId) : undefined,
        revenue: p._sum.total ?? 0,
        units: p._sum.quantity ?? 0,
      }))
      .filter((p) => p.producer),
    paymentMethods: paymentMethods.map((p) => ({ method: p.paymentMethod ?? "inconnu", count: p._count })),
    topZones: zones.map((z) => ({ zone: zoneById.get(z.zoneId ?? "") ?? "—", count: z._count })),
  };
}

/** Série journalière du chiffre d'affaires sur N jours (graphiques, bonus 10). */
export async function getDailyRevenueSeries(days = 14) {
  const from = daysAgo(days);
  const orders = await prisma.order.findMany({
    where: { isPaid: true, status: { notIn: ["CANCELLED", "REFUNDED"] }, createdAt: { gte: from } },
    select: { total: true, createdAt: true },
  });

  const buckets = new Map<string, { date: string; revenue: number; orders: number }>();
  for (let i = 0; i <= days; i++) {
    const d = daysAgo(days - i);
    buckets.set(d.toISOString().slice(0, 10), { date: d.toISOString().slice(0, 10), revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.revenue += o.total;
      bucket.orders += 1;
    }
  }
  return Array.from(buckets.values());
}
