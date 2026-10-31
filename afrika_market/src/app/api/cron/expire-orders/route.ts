import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { expireUnpaidOrders } from "@/lib/services/order.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tâche planifiée : annule les commandes jamais payées et restitue leur stock.
 * Protégée par CRON_SECRET (Vercel Cron l'envoie en « Authorization: Bearer … »).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const received = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(received);
  const b = Buffer.from(secret ?? "");
  if (!secret || a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const expired = await expireUnpaidOrders();
  return NextResponse.json({ expired });
}
