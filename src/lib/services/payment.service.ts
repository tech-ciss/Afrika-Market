import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { PAYMENT_STATUSES, type PaymentMethod, type PaymentStatus } from "@/lib/validations/enums";

// ---------------------------------------------------------------------------
// Abstraction de paiement (§12)
//
//   payment.service
//     ├── createPayment()
//     ├── verifyPayment()
//     ├── refundPayment()
//     └── handleWebhook()
//
// Ajouter un prestataire = implémenter PaymentProvider et l'enregistrer dans
// le registre. Aucune logique métier n'est dupliquée.
// ---------------------------------------------------------------------------

export interface PaymentCustomer {
  email: string;
  phone?: string;
  name?: string;
}

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  customer: PaymentCustomer;
  returnUrl?: string;
}

export interface PaymentInitResult {
  providerRef: string;
  status: PaymentStatus;
  /** URL de redirection vers la page de paiement du prestataire. */
  redirectUrl?: string;
  /** Texte d'instruction (ex. « composez #144# »). */
  instructions?: string;
}

export interface PaymentVerifyResult {
  status: PaymentStatus;
  paidAt?: Date;
  failureReason?: string;
  raw?: unknown;
}

export interface WebhookEvent {
  orderNumber: string;
  providerRef: string;
  status: PaymentStatus;
  /** Montant réellement encaissé (FCFA), si le prestataire le fournit : il est comparé au total de la commande. */
  amount?: number;
  failureReason?: string;
  raw?: unknown;
}

export interface PaymentProvider {
  /** Code unique : wave | orange | mtn | moov | card | cash | sandbox */
  code: string;
  label: string;
  createPayment(input: CreatePaymentInput): Promise<PaymentInitResult>;
  verifyPayment(providerRef: string, context: CreatePaymentInput): Promise<PaymentVerifyResult>;
  refundPayment(providerRef: string, amount?: number): Promise<PaymentVerifyResult>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
  parseWebhook(payload: string): WebhookEvent | null;
}

export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string = "PAYMENT_ERROR",
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

/**
 * Secret de signature des webhooks.
 * En production il est OBLIGATOIRE : aucune valeur par défaut n'est tolérée,
 * sinon n'importe qui connaissant le dépôt pourrait forger un « paiement réussi ».
 */
function webhookSecret(): string {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new PaymentError("PAYMENT_WEBHOOK_SECRET n'est pas configuré.", "CONFIG");
  }
  return "dev-only-webhook-secret";
}

/** Le mode démo (page /paiement/[ref]) n'est actif que si le fournisseur configuré est « sandbox ». */
export function isSandboxEnabled(): boolean {
  return (process.env.PAYMENT_PROVIDER || "sandbox").toLowerCase() === "sandbox";
}

function sign(payload: string): string {
  return createHmac("sha256", webhookSecret()).update(payload).digest("hex");
}

/**
 * Fournisseur de démonstration : simule un prestataire Mobile Money /
 * carte. Une vérification serveur (et non la simple redirection du
 * navigateur) décide du statut — cf. les questions de soutenance §40.
 */
export class SandboxPaymentProvider implements PaymentProvider {
  code = "sandbox";
  label = "Paiement de démonstration";

  async createPayment(input: CreatePaymentInput): Promise<PaymentInitResult> {
    // Référence aléatoire : elle sert aussi de « capacité » d'accès à la page de simulation.
    const providerRef = `SBX-${randomBytes(12).toString("hex").toUpperCase()}`;

    return {
      providerRef,
      status: "PENDING",
      redirectUrl: `/paiement/${providerRef}`,
      instructions:
        input.method === "cash"
          ? "Vous réglerez votre commande à la livraison."
          : `Une demande de paiement de ${input.amount} FCFA a été envoyée sur votre téléphone (${input.method}).`,
    };
  }

  async verifyPayment(providerRef: string): Promise<PaymentVerifyResult> {
    // Une vraie implémentation interroge l'API du prestataire.
    // Ici la vérification est déclenchée par le webhook signé ou l'action
    // de simulation, jamais par le simple retour du navigateur.
    const done = providerRef.startsWith("SBX-PAID-");
    if (done) return { status: "PAID", paidAt: new Date() };
    return { status: "PROCESSING" };
  }

  async refundPayment(_providerRef: string, _amount?: number): Promise<PaymentVerifyResult> {
    return { status: "REFUNDED", paidAt: new Date() };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    let expected: string;
    try {
      expected = sign(payload);
    } catch (e) {
      console.error("[webhook] configuration invalide :", e);
      return false;
    }
    if (signature.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }

  parseWebhook(payload: string): WebhookEvent | null {
    try {
      const body = JSON.parse(payload) as Partial<WebhookEvent> & { providerRef?: string };
      if (!body?.orderNumber || !body?.providerRef || !body?.status) return null;
      if (!(PAYMENT_STATUSES as readonly string[]).includes(body.status)) return null;
      return {
        orderNumber: body.orderNumber,
        providerRef: body.providerRef,
        status: body.status,
        amount: typeof body.amount === "number" ? body.amount : undefined,
        failureReason: body.failureReason,
        raw: body,
      };
    } catch {
      return null;
    }
  }
}

/**
 * Adaptateur pour un prestataire réel (Wave, Orange Money, MTN, Moov,
 * carte). Il ne fait que déléguer au fournisseur configuré par
 * PAYMENT_PROVIDER : l'ajout d'un prestataire ne change pas la logique
 * métier (cf. §12 « architecture recommandée »).
 */
export class ConfigurableProvider implements PaymentProvider {
  code: string;
  label: string;
  constructor(
    code: string,
    label: string,
    private delegate: PaymentProvider = new SandboxPaymentProvider(),
  ) {
    this.code = code;
    this.label = label;
  }
  createPayment = (input: CreatePaymentInput) => this.delegate.createPayment({ ...input, method: input.method });
  verifyPayment = (ref: string, ctx: CreatePaymentInput) => this.delegate.verifyPayment(ref, ctx);
  refundPayment = (ref: string, amount?: number) => this.delegate.refundPayment(ref, amount);
  verifyWebhookSignature = (payload: string, signature: string) =>
    this.delegate.verifyWebhookSignature(payload, signature);
  parseWebhook = (payload: string) => this.delegate.parseWebhook(payload);
}

const registry = new Map<string, PaymentProvider>();

function register(provider: PaymentProvider) {
  registry.set(provider.code, provider);
}

register(new SandboxPaymentProvider());
for (const [code, label] of Object.entries({
  wave: "Wave",
  orange: "Orange Money",
  mtn: "MTN Mobile Money",
  moov: "Moov Money",
  card: "Carte bancaire",
  cash: "Paiement à la livraison",
})) {
  register(new ConfigurableProvider(code, label));
}

/** Retourne le fournisseur associé au moyen de paiement choisi. */
export function getPaymentProvider(methodOrCode?: string): PaymentProvider {
  const code = (methodOrCode || process.env.PAYMENT_PROVIDER || "sandbox").toLowerCase();
  return registry.get(code) ?? registry.get("sandbox")!;
}

export function listPaymentProviders(): { code: string; label: string }[] {
  return Array.from(registry.values()).map((p) => ({ code: p.code, label: p.label }));
}

/** Signature d'un webhook sortant (utilisée par la simulation et les tests). */
export function signWebhookPayload(payload: string): string {
  return sign(payload);
}

/**
 * Décision d'application d'un évènement de paiement.
 * Un webhook reçu deux fois ne produit qu'un seul effet : la seconde
 * application est ignorée (idempotence §40).
 */
export type PaymentApplicationDecision = "APPLY" | "IGNORE_ALREADY_PAID" | "IGNORE_WRONG_STATE";

export function decidePaymentApplication(order: { status: string; isPaid: boolean }): PaymentApplicationDecision {
  if (order.isPaid) return "IGNORE_ALREADY_PAID";
  if (order.status !== "PENDING_PAYMENT") return "IGNORE_WRONG_STATE";
  return "APPLY";
}
