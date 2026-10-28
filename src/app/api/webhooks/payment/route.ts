import { NextResponse } from "next/server";
import { rateLimitRequest, LIMITS } from "@/lib/security/rate-limit";
import { getPaymentProvider, PaymentError } from "@/lib/services/payment.service";
import { handlePaymentEvent, OrderConflictError } from "@/lib/services/order.service";

export const runtime = "nodejs";

/**
 * Webhook de paiement (§12 — handleWebhook).
 *
 * Sécurité :
 *  - signature HMAC vérifiée avec PAYMENT_WEBHOOK_SECRET (timing-safe) ;
 *  - la visite du navigateur sur la page de confirmation n'a aucun effet
 *    sur le statut de la commande : seul ce webhook (ou l'interrogation
 *    du prestataire) fait évoluer le paiement ;
 *  - les rejeux sont idempotents (écritures conditionnelles dans markOrderPaid) ;
 *  - PAID valide la commande (montant contrôlé) ; FAILED / CANCELLED l'annulent
 *    et restituent le stock réservé.
 *
 * Codes de retour : 401 signature invalide, 400 évènement invalide ou refusé,
 * 409 conflit transitoire (le prestataire peut rejouer), 200 sinon.
 */
export async function POST(request: Request) {
  if (!rateLimitRequest("webhook", request, LIMITS.webhook).ok) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const payload = await request.text();
  const signature = request.headers.get("x-afrika-signature") ?? "";

  const provider = getPaymentProvider();
  if (!provider.verifyWebhookSignature(payload, signature)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  const event = provider.parseWebhook(payload);
  if (!event) {
    return NextResponse.json({ error: "Évènement invalide" }, { status: 400 });
  }

  try {
    const result = await handlePaymentEvent(event);
    return NextResponse.json({ received: true, changed: result.changed, status: result.status });
  } catch (e) {
    if (e instanceof OrderConflictError) {
      return NextResponse.json({ error: "Conflit, réessayez" }, { status: 409 });
    }
    if (e instanceof PaymentError) {
      // Référence ou montant incohérent : message fonctionnel, sans détail interne.
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
    }
    if (e instanceof Error && e.message === "Commande introuvable.") {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }
    console.error("[webhook] erreur de traitement :", e);
    return NextResponse.json({ error: "Erreur de traitement" }, { status: 500 });
  }
}
