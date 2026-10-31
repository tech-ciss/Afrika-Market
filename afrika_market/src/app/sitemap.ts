import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, producers] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true } }),
    prisma.producer.findMany({ where: { status: "APPROVED", isActive: true }, select: { slug: true } }),
  ]);

  const statics = [
    "",
    "/produits",
    "/categories",
    "/producteurs",
    "/a-propos",
    "/mission",
    "/faq",
    "/contact",
    "/cgv",
    "/confidentialite",
    "/cookies",
    "/mentions-legales",
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  return [
    ...statics,
    ...products.map((p) => ({
      url: `${BASE}/produits/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...categories.map((c) => ({ url: `${BASE}/categories/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...producers.map((p) => ({ url: `${BASE}/producteurs/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
