import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Livraison — calcul des frais (§14 / §15)
// ---------------------------------------------------------------------------

export interface ZoneFeeRule {
  name: string;
  basePrice: number;
  freeFrom: number | null;
  estimatedDays: number;
  allowCashOnDelivery: boolean;
  isActive: boolean;
}

export interface ShippingInput {
  zone: ZoneFeeRule | null;
  subtotal: number;
  method: "HOME" | "RELAY_POINT" | "PICKUP_PRODUCER" | "PICKUP_PARTNER";
  /** Code promo « livraison offerte ». */
  freeShippingPromo?: boolean;
}

export interface ShippingResult {
  fee: number;
  estimatedDays: number;
  freeReason?: "SEUIL_ATTEINT" | "PROMO" | "RETRAIT";
}

/**
 * Règle de tarification (configurable depuis l'administration) :
 *  - retrait sur place → gratuit ;
 *  - tarif fixe par zone ;
 *  - livraison offerte au-delà d'un seuil de montant de commande.
 */
export function computeShippingFee(input: ShippingInput): ShippingResult {
  const { zone, subtotal, method, freeShippingPromo } = input;

  if (method === "PICKUP_PRODUCER" || method === "PICKUP_PARTNER") {
    return { fee: 0, estimatedDays: 0, freeReason: "RETRAIT" };
  }
  if (!zone || !zone.isActive) {
    return { fee: 0, estimatedDays: 0 };
  }
  if (freeShippingPromo) {
    return { fee: 0, estimatedDays: zone.estimatedDays, freeReason: "PROMO" };
  }
  if (zone.freeFrom !== null && zone.freeFrom > 0 && subtotal >= zone.freeFrom) {
    return { fee: 0, estimatedDays: zone.estimatedDays, freeReason: "SEUIL_ATTEINT" };
  }
  return { fee: zone.basePrice, estimatedDays: zone.estimatedDays };
}

export function estimateDeliveryDate(days: number, from: Date = new Date()): Date {
  const d = new Date(from.getTime());
  d.setDate(d.getDate() + Math.max(days, 0));
  return d;
}

// ---------------------------------------------------------------------------
// Lecture des zones (base)
// ---------------------------------------------------------------------------

export type ZoneWithDistricts = ZoneFeeRule & {
  id: string;
  countryId: string;
  description: string | null;
  districts: { name: string }[];
  country?: { name: string; code: string };
};

export async function getActiveZones(countryCode = "CI"): Promise<ZoneWithDistricts[]> {
  const zones = await prisma.deliveryZone.findMany({
    where: { isActive: true, country: { code: countryCode, isActive: true } },
    include: { districts: { orderBy: { name: "asc" } }, country: { select: { name: true, code: true } } },
    orderBy: { position: "asc" },
  });
  return zones.map((z) => ({
    id: z.id,
    countryId: z.countryId,
    name: z.name,
    description: z.description,
    basePrice: z.basePrice,
    freeFrom: z.freeFrom,
    estimatedDays: z.estimatedDays,
    allowCashOnDelivery: z.allowCashOnDelivery,
    isActive: z.isActive,
    districts: z.districts.map((d) => ({ name: d.name })),
    country: z.country,
  }));
}

/** Retrouve la zone applicable à partir de la ville et du district saisis. */
export function resolveZone(zones: ZoneWithDistricts[], city: string, district: string): ZoneWithDistricts | null {
  const byName = (v: string) => v.trim().toLowerCase();
  const direct = zones.find((z) => byName(z.name) === byName(city));
  if (direct) return direct;
  const byDistrict = zones.find((z) => z.districts.some((d) => byName(d.name) === byName(district)));
  if (byDistrict) return byDistrict;
  return zones.find((z) => byName(z.name) === byName(district)) ?? null;
}
