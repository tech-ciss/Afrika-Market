import { headers } from "next/headers";

/**
 * Rate limiting (cahier des charges §30).
 *
 * Fenêtre fixe en mémoire : suffisant pour la démo et un seul processus.
 * Sur Vercel (serverless) chaque instance a sa propre mémoire : la limite est
 * donc "au mieux". Pour une garantie globale, remplacer `store` par Upstash
 * Redis (@upstash/ratelimit) en gardant la même signature `rateLimit()`.
 */
type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Secondes avant de pouvoir réessayer (0 si ok). */
  retryAfter: number;
}

export function rateLimit(key: string, { limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();

  // Nettoyage opportuniste pour éviter la croissance infinie de la Map.
  if (store.size > 5000) {
    for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
  }

  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 };
}

/** Adresse IP du client (derrière le proxy Vercel : x-forwarded-for). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** Raccourci pour les Server Actions : limite par IP et par portée (login, register…). */
export async function rateLimitByIp(scope: string, opts: RateLimitOptions): Promise<RateLimitResult> {
  return rateLimit(`${scope}:${await getClientIp()}`, opts);
}

/** Variante pour les Route Handlers (le webhook reçoit un objet Request). */
export function rateLimitRequest(scope: string, request: Request, opts: RateLimitOptions): RateLimitResult {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return rateLimit(`${scope}:${ip}`, opts);
}

export const LIMITS = {
  login: { limit: 5, windowMs: 60_000 },
  register: { limit: 5, windowMs: 10 * 60_000 },
  contact: { limit: 3, windowMs: 10 * 60_000 },
  newsletter: { limit: 5, windowMs: 10 * 60_000 },
  promo: { limit: 20, windowMs: 60_000 },
  webhook: { limit: 120, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitOptions>;
