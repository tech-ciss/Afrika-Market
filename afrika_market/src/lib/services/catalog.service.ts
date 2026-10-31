import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Catalogue : recherche (§7 A2), filtres (A3), tri (A4), pagination
// ---------------------------------------------------------------------------

export type SortKey = "relevance" | "price-asc" | "price-desc" | "newest" | "rating" | "sales";

export const SORT_OPTIONS: Record<SortKey, Prisma.ProductOrderByWithRelationInput[]> = {
  relevance: [{ isFeatured: "desc" }, { salesCount: "desc" }],
  "price-asc": [{ price: "asc" }],
  "price-desc": [{ price: "desc" }],
  newest: [{ createdAt: "desc" }],
  rating: [{ averageRating: "desc" }],
  sales: [{ salesCount: "desc" }],
};

export interface CatalogFilters {
  q?: string;
  category?: string; // slug
  country?: string; // code ISO
  region?: string;
  producer?: string; // slug
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isNew?: boolean;
  onSale?: boolean;
  minRating?: number;
  sort?: SortKey;
  page?: number;
  perPage?: number;
  includeInactive?: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageCount: number;
  perPage: number;
}

const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  price: true,
  compareAtPrice: true,
  currency: true,
  images: true,
  stock: true,
  lowStockThreshold: true,
  unit: true,
  averageRating: true,
  reviewCount: true,
  isNew: true,
  isFeatured: true,
  salesCount: true,
  region: true,
  city: true,
  createdAt: true,
  producer: { select: { id: true, name: true, slug: true, city: true, region: true } },
  category: { select: { id: true, name: true, slug: true } },
  country: { select: { name: true, code: true } },
} satisfies Prisma.ProductSelect;

export type ProductCard = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

/** Construit le WHERE Prisma à partir des filtres de l'interface. */
export async function buildCatalogWhere(filters: CatalogFilters): Promise<Prisma.ProductWhereInput> {
  const where: Prisma.ProductWhereInput = {
    isActive: filters.includeInactive ? undefined : true,
  };

  if (filters.category) {
    const category = await prisma.category.findUnique({ where: { slug: filters.category } });
    if (category) {
      const children = await prisma.category.findMany({ where: { parentId: category.id }, select: { id: true } });
      where.categoryId = { in: [category.id, ...children.map((c) => c.id)] };
    } else {
      where.categoryId = "__none__";
    }
  }

  if (filters.country) where.country = { code: filters.country };
  if (filters.region) where.region = { contains: filters.region };
  if (filters.producer) where.producer = { slug: filters.producer };
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {
      ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
    };
  }
  if (filters.inStock) where.stock = { gt: 0 };
  if (filters.isNew) where.isNew = true;
  if (filters.onSale) where.compareAtPrice = { not: null };
  if (filters.minRating) where.averageRating = { gte: filters.minRating };

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    const or: Prisma.ProductWhereInput[] = [
      { name: { contains: q } },
      { description: { contains: q } },
      { shortDescription: { contains: q } },
      { tags: { contains: q } },
      { region: { contains: q } },
      { city: { contains: q } },
      { producer: { name: { contains: q } } },
      { country: { name: { contains: q } } },
      { category: { name: { contains: q } } },
    ];
    where.AND = [{ OR: or }];
  }

  return where;
}

export async function searchProducts(filters: CatalogFilters = {}): Promise<Paginated<ProductCard>> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(48, Math.max(1, filters.perPage ?? 12));
  const where = await buildCatalogWhere(filters);
  const orderBy = SORT_OPTIONS[filters.sort ?? "relevance"] ?? SORT_OPTIONS.relevance;

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: productCardSelect,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / perPage)), perPage };
}

/** Filêtres complémentaires (pays, régions, producteurs) pour la barre latérale. */
export async function getCatalogFacets() {
  const [countries, producers, priceRange, categories] = await Promise.all([
    prisma.country.findMany({
      where: { isActive: true, products: { some: { isActive: true } } },
      select: { code: true, name: true, _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.producer.findMany({
      where: { status: "APPROVED", products: { some: { isActive: true } } },
      select: { slug: true, name: true, _count: { select: { products: true } } },
      orderBy: { name: "asc" },
      take: 30,
    }),
    prisma.product.aggregate({ where: { isActive: true }, _min: { price: true }, _max: { price: true } }),
    getCategories(),
  ]);

  const regions = await prisma.product.findMany({
    where: { isActive: true, region: { not: null } },
    select: { region: true },
    distinct: ["region"],
    orderBy: { region: "asc" },
  });

  return {
    countries,
    producers,
    regions: regions.map((r) => r.region!).filter(Boolean),
    minPrice: priceRange._min.price ?? 0,
    maxPrice: priceRange._max.price ?? 0,
    categories,
  };
}

// ---------------------------------------------------------------------------
// Lecture produit
// ---------------------------------------------------------------------------

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      producer: true,
      category: true,
      country: true,
      variants: { where: { isActive: true }, orderBy: { price: "asc" } },
      reviews: {
        where: { status: "APPROVED" },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function getSimilarProducts(productId: string, categoryId: string, limit = 4) {
  return prisma.product.findMany({
    where: { categoryId, id: { not: productId }, isActive: true },
    select: productCardSelect,
    orderBy: { salesCount: "desc" },
    take: limit,
  });
}

export async function getProductsByIds(ids: string[]): Promise<ProductCard[]> {
  if (ids.length === 0) return [];
  return prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    select: productCardSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    select: productCardSelect,
    orderBy: { salesCount: "desc" },
    take: limit,
  });
}

export async function getNewProducts(limit = 8) {
  return prisma.product.findMany({
    where: { isActive: true },
    select: productCardSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getSaleProducts(limit = 8) {
  return prisma.product.findMany({
    where: { isActive: true, compareAtPrice: { not: null } },
    select: productCardSelect,
    orderBy: { salesCount: "desc" },
    take: limit,
  });
}

export async function getProducerProducts(producerId: string, includeInactive = false) {
  return prisma.product.findMany({
    where: { producerId, ...(includeInactive ? {} : { isActive: true }) },
    include: { category: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// ---------------------------------------------------------------------------
// Catégories
// ---------------------------------------------------------------------------

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  position: number;
  productCount: number;
  children: CategoryNode[];
};

export async function getCategories(includeInactive = false): Promise<CategoryNode[]> {
  const categories = await prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { position: "asc" },
    include: { _count: { select: { products: { where: includeInactive ? {} : { isActive: true } } } } },
  });

  const nodes: CategoryNode[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    imageUrl: c.imageUrl,
    position: c.position,
    productCount: c._count.products,
    children: [],
  }));

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const roots: CategoryNode[] = [];
  for (const c of categories) {
    const node = byId.get(c.id)!;
    if (c.parentId && byId.has(c.parentId)) byId.get(c.parentId)!.children.push(node);
    else roots.push(node);
  }
  return roots;
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

/** Recalcule la note moyenne après création / modération d'un avis. */
export async function recalcProductRating(productId: string): Promise<void> {
  const aggregate = await prisma.review.aggregate({
    where: { productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
      reviewCount: aggregate._count,
    },
  });
}
