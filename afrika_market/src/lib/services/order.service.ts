import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { formatDateISO } from "@/lib/utils";
import type { CheckoutInput } from "@/lib/validations/commerce";
import type { OrderStatus, PaymentMethod } from "@/lib/validations/enums";
import { computeShippingFee, getActiveZones } from "./delivery.service";
import {
  evaluatePromoCode,
  promoCustomerFilter,
  PROMO_RELEASING_STATUSES,
  type PromoResult,
} from "./promo.service";
import { decrementStock, restoreStock, StockError, checkStock, type StockRequest } from "./stock.service";
import {
  getPaymentProvider,
  PaymentError,
  decidePaymentApplication,
  type WebhookEvent,
} from "./payment.service";

// ---------------------------------------------------------------------------
// Commandes (§16) + création atomique (§31)
// ---------------------------------------------------------------------------

export interface CheckoutItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface CreateOrderParams {
  /** null = commande invité. */
  userId: string | null;
  /** Un invité transmet uniquement des références : jamais de prix. */
  items?: CheckoutItemInput[];
  input: CheckoutInput;
}

export interface CreateOrderFailure {
  ok: false;
  error: string;
  field?: "stock" | "zone" | "promo" | "payment" | "cart";
  issues?: { productId: string; name: string; requested: number; available: number }[];
}

export interface CreateOrderSuccess {
  ok: true;
  orderId: string;
  number: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  discount: number;
  isPaid: boolean;
  paymentMethod: PaymentMethod;
  providerRef?: string;
  instructions?: string;
  guestToken?: string;
}

export type CreateOrderResult = CreateOrderSuccess | CreateOrderFailure;

/** Matrice de transitions autorisées entre statuts de commande (§16). */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CONFIRMED", "CANCELLED"],
  PAID: ["CONFIRMED", "PREPARING", "CANCELLED", "REFUNDED"],
  CONFIRMED: ["PREPARING", "CANCELLED", "REFUNDED"],
  PREPARING: ["READY_FOR_DELIVERY", "IN_TRANSIT", "CANCELLED"],
  READY_FOR_DELIVERY: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  return (ORDER_TRANSITIONS[from] ?? []).includes(to);
}

interface ResolvedItem extends StockRequest {
  name: string;
  slug: string;
  sku: string;
  imageUrl: string;
  unit: string;
  origin: string;
  producerName: string;
  producerId: string;
  unitPrice: number;
  categoryId: string;
}

const ORDER_INCLUDE = {
  items: true,
  delivery: { include: { zone: true } },
  payment: true,
  events: { orderBy: { createdAt: "asc" as const } },
  promo: { select: { code: true, type: true, value: true } },
} as const;

/**
 * Numéro unique au format AM-20261027-00001.
 * Le suffixe repart du plus grand numéro existant du jour (et non d'un count(),
 * faux dès qu'une commande est supprimée). En cas de course entre deux requêtes,
 * la contrainte d'unicité fait échouer la seconde, qui retente (cf. createOrder).
 */
export async function generateOrderNumber(now: Date = new Date()): Promise<string> {
  const prefix = `AM-${formatDateISO(now)}`;
  const last = await prisma.order.findFirst({
    where: { number: { startsWith: `${prefix}-` } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const lastSeq = last ? Number.parseInt(last.number.slice(prefix.length + 1), 10) : 0;
  const next = (Number.isFinite(lastSeq) ? lastSeq : 0) + 1;
  return `${prefix}-${String(next).padStart(5, "0")}`;
}

/** Résolution des lignes : panier serveur pour un client, références pour un invité. */
async function resolveItems(params: CreateOrderParams): Promise<ResolvedItem[]> {
  let requests: StockRequest[];

  if (params.userId) {
    const cart = await prisma.cartItem.findMany({
      where: { userId: params.userId },
      include: { product: { include: { producer: true, variants: true } } },
    });
    requests = cart.map((c) => ({
      productId: c.productId,
      variantId: c.variantId,
      quantity: c.quantity,
    }));
  } else {
    requests = (params.items ?? []).map((i) => ({
      productId: i.productId,
      variantId: i.variantId ?? null,
      quantity: i.quantity,
    }));
  }

  const resolved: ResolvedItem[] = [];
  for (const req of requests) {
    const product = await prisma.product.findUnique({
      where: { id: req.productId },
      include: { producer: true, variants: true, country: true },
    });
    if (!product || !product.isActive) continue;
    const variant = req.variantId ? product.variants.find((v) => v.id === req.variantId) : undefined;
    if (req.variantId && !variant) continue;

    const region = [product.country.name, product.region, product.city].filter(Boolean).join(" · ");
    resolved.push({
      productId: product.id,
      variantId: req.variantId,
      quantity: req.quantity,
      name: variant ? `${product.name} — ${variant.name}` : product.name,
      slug: product.slug,
      sku: variant?.sku ?? product.sku ?? `AM-${product.id.slice(-6).toUpperCase()}`,
      imageUrl: (JSON.parse(product.images || "[]") as string[])[0] ?? "",
      unit: product.unit,
      origin: region,
      producerName: product.producer.name,
      producerId: product.producer.id,
      // Prix TOUJOURS relu en base : jamais celui envoyé par le navigateur.
      unitPrice: variant?.price ?? product.price,
      categoryId: product.categoryId,
    });
  }
  return resolved;
}

/** Levée dans la transaction si un code promo atteint sa limite d'utilisations entre-temps. */
class PromoLimitError extends Error {
  constructor() {
    super("Ce code promotionnel a atteint son nombre maximal d'utilisations.");
    this.name = "PromoLimitError";
  }
}

/** Levée quand la commande a été modifiée par une autre requête entre la lecture et l'écriture. */
export class OrderConflictError extends Error {
  constructor() {
    super("La commande a été modifiée entre-temps, veuillez réessayer.");
    this.name = "OrderConflictError";
  }
}

const CASH_INSTRUCTIONS = "Vous réglerez votre commande à la livraison.";

/**
 * Création d'une commande — les étapes du §31 :
 * lecture base → vérification stock → recalcul prix → promo → livraison →
 * (transaction : commande + décrément atomique du stock + paiement + livraison) →
 * initialisation du paiement auprès du prestataire.
 *
 * Le prestataire n'est appelé QU'APRÈS la transaction : si celle-ci échoue ou est
 * rejouée (collision de numéro), aucun paiement orphelin n'est créé côté prestataire.
 * Si l'initialisation du paiement échoue, la commande est annulée et le stock restitué.
 */
export async function createOrder(params: CreateOrderParams, attempt = 0): Promise<CreateOrderResult> {
  const { input, userId } = params;

  // --- Zones & livraison -------------------------------------------------
  const zones = await getActiveZones();
  const zone = zones.find((z) => z.id === input.zoneId) ?? null;
  if (!zone) {
    return { ok: false, error: "Zone de livraison invalide.", field: "zone" };
  }
  if (input.paymentMethod === "cash" && !zone.allowCashOnDelivery) {
    return {
      ok: false,
      error: "Le paiement à la livraison n'est pas disponible dans cette zone.",
      field: "payment",
    };
  }

  // --- Lignes & stock ----------------------------------------------------
  const items = await resolveItems(params);
  if (items.length === 0) {
    return { ok: false, error: "Votre panier est vide.", field: "cart" };
  }
  let stock = await checkStock(items);
  if (!stock.ok) {
    // Du stock peut être immobilisé par des commandes impayées périmées : on le libère puis on revérifie.
    const released = await expireUnpaidOrders();
    if (released > 0) stock = await checkStock(items);
  }
  if (!stock.ok) {
    return { ok: false, error: "Certains produits ne sont plus disponibles.", field: "stock", issues: stock.issues };
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  // --- Promotion ---------------------------------------------------------
  let promo: PromoResult | null = null;
  let promoRecord: { id: string; code: string } | null = null;
  if (input.promoCode?.trim()) {
    const categoryIds = Array.from(new Set(items.map((i) => i.categoryId)));
    promo = await evaluatePromoCode(input.promoCode, {
      subtotal,
      productIds: items.map((i) => i.productId),
      categoryIds,
      userId,
      email: input.email,
    });
    if (!promo.ok) {
      return { ok: false, error: promo.message ?? "Code promotionnel invalide.", field: "promo" };
    }
    const record = await prisma.promoCode.findUnique({ where: { code: input.promoCode.trim().toUpperCase() } });
    if (record) promoRecord = { id: record.id, code: record.code };
  }

  const shipping = computeShippingFee({
    zone,
    subtotal,
    method: input.deliveryMethod,
    freeShippingPromo: promo?.freeShipping,
  });
  const discount = promo?.discount ?? 0;
  const total = Math.max(0, subtotal - discount) + shipping.fee;
  const isCash = input.paymentMethod === "cash";

  const provider = getPaymentProvider(input.paymentMethod);
  const orderNumber = await generateOrderNumber();
  const guestToken = userId ? undefined : randomBytes(24).toString("hex");

  const shippingAddress = {
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    email: input.email,
    country: "Côte d'Ivoire",
    city: input.city,
    district: input.district,
    neighborhood: input.neighborhood ?? "",
    street: input.street,
    additionalInfo: input.additionalInfo ?? "",
    zoneName: zone.name,
  };

  let created: Awaited<ReturnType<typeof insertOrder>>;
  try {
    created = await insertOrder();
  } catch (e) {
    if (e instanceof StockError) {
      return { ok: false, error: "Le stock a été épuisé pendant votre commande, veuillez vérifier votre panier.", field: "stock" };
    }
    if (e instanceof PromoLimitError) {
      return { ok: false, error: e.message, field: "promo" };
    }
    if (isUniqueViolation(e) && attempt < 3) {
      // Collision de numéro : on retente avec un numéro frais (rien n'a été créé chez le prestataire).
      return createOrder(params, attempt + 1);
    }
    throw e;
  }

  // --- Initialisation du paiement (hors transaction) ---------------------
  let init: { providerRef?: string; instructions?: string } = isCash ? { instructions: CASH_INSTRUCTIONS } : {};
  if (!isCash) {
    try {
      const payment = await provider.createPayment({
        orderId: created.number,
        orderNumber: created.number,
        amount: total,
        currency: "XOF",
        method: input.paymentMethod,
        customer: { email: input.email, phone: input.phone, name: `${input.firstName} ${input.lastName}` },
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/compte/commandes/${created.number}`,
      });
      init = { providerRef: payment.providerRef, instructions: payment.instructions };
      await prisma.payment.update({
        where: { orderId: created.id },
        data: {
          providerRef: payment.providerRef,
          metadata: JSON.stringify({ method: input.paymentMethod, instructions: payment.instructions ?? "" }),
        },
      });
    } catch (e) {
      await cancelOrder(created.number, "Initialisation du paiement impossible", {
        paymentStatus: "FAILED",
        failureReason: e instanceof Error ? e.message : "INIT_FAILED",
      }).catch((err) => console.error("[order] annulation après échec d'initialisation :", err));
      const message = e instanceof PaymentError ? e.message : "Le service de paiement est indisponible.";
      return { ok: false, error: message, field: "payment" };
    }
  }

  // Le panier n'est vidé qu'une fois la commande réellement lancée.
  if (userId) {
    await prisma.cartItem.deleteMany({ where: { userId } });
  }

  return {
    ok: true,
    orderId: created.id,
    number: created.number,
    total: created.total,
    subtotal: created.subtotal,
    shippingCost: created.shippingCost,
    discount: created.discount,
    isPaid: created.isPaid,
    paymentMethod: input.paymentMethod,
    providerRef: init.providerRef,
    instructions: init.instructions,
    guestToken,
  };

  /** Transaction unique : commande + stock + paiement + livraison + événements. */
  async function insertOrder() {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          number: orderNumber,
          userId: userId ?? null,
          email: input.email,
          status: isCash ? "CONFIRMED" : "PENDING_PAYMENT",
          subtotal,
          shippingCost: shipping.fee,
          discount,
          total,
          currency: "XOF",
          shippingAddress: JSON.stringify(shippingAddress),
          billingAddress: JSON.stringify(shippingAddress),
          note: input.note ?? "",
          guestToken,
          promoCodeId: promoRecord?.id ?? null,
          promoCode: promoRecord?.code ?? null,
          paymentMethod: input.paymentMethod,
          zoneId: zone!.id,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              producerId: i.producerId,
              variantId: i.variantId,
              productName: i.name,
              productSlug: i.slug,
              sku: i.sku,
              imageUrl: i.imageUrl,
              unit: i.unit,
              origin: i.origin,
              producerName: i.producerName,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              total: i.unitPrice * i.quantity,
            })),
          },
        },
      });

      // Décrément atomique du stock dans LA MÊME transaction.
      await decrementStock(tx, items);

      // Les limites du code promo sont revérifiées ici, commande incluse : c'est ce qui
      // protège d'une course entre deux commandes simultanées utilisant le même code.
      if (promoRecord) {
        await assertPromoWithinLimits(tx, promoRecord.id, userId, input.email);
      }

      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: provider.code,
          providerRef: null, // renseigné après l'appel au prestataire
          amount: total,
          currency: "XOF",
          status: "PENDING",
          metadata: JSON.stringify({ method: input.paymentMethod, instructions: isCash ? CASH_INSTRUCTIONS : "" }),
        },
      });

      await tx.delivery.create({
        data: {
          orderId: order.id,
          zoneId: zone!.id,
          method: input.deliveryMethod,
          status: isCash ? "CONFIRMED" : "PENDING",
          recipient: `${input.firstName} ${input.lastName}`,
          phone: input.phone,
          addressSnapshot: JSON.stringify(shippingAddress),
          shippingCost: shipping.fee,
          estimatedDate: new Date(Date.now() + zone!.estimatedDays * 86_400_000),
          trackingNumber: `TRK${randomBytes(5).toString("hex").toUpperCase()}`,
        },
      });

      await tx.orderEvent.createMany({
        data: [
          { orderId: order.id, status: "CREATED", label: "Commande créée", note: `Numéro ${order.number}` },
          {
            orderId: order.id,
            status: isCash ? "CONFIRMED" : "PENDING_PAYMENT",
            label: isCash ? "Paiement à la livraison" : "En attente de paiement",
            note: isCash ? CASH_INSTRUCTIONS : null,
          },
        ],
      });

      return order;
    });
  }
}

async function assertPromoWithinLimits(
  tx: Prisma.TransactionClient,
  promoId: string,
  userId: string | null,
  email: string,
): Promise<void> {
  const promo = await tx.promoCode.findUnique({
    where: { id: promoId },
    select: { maximumUses: true, maximumUsesPerUser: true },
  });
  if (!promo) return;
  if (promo.maximumUses !== null) {
    const total = await tx.order.count({
      where: { promoCodeId: promoId, status: { notIn: PROMO_RELEASING_STATUSES } },
    });
    if (total > promo.maximumUses) throw new PromoLimitError();
  }
  const customer = promoCustomerFilter(userId, email);
  if (promo.maximumUsesPerUser !== null && customer) {
    const mine = await tx.order.count({
      where: { promoCodeId: promoId, ...customer, status: { notIn: PROMO_RELEASING_STATUSES } },
    });
    if (mine > promo.maximumUsesPerUser) throw new PromoLimitError();
  }
}

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}

// ---------------------------------------------------------------------------
// Statuts, paiement, annulation, remboursement
// ---------------------------------------------------------------------------

export interface OrderChange {
  changed: boolean;
  status: OrderStatus;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "En attente de paiement",
  PAID: "Paiement reçu",
  CONFIRMED: "Commande confirmée",
  PREPARING: "Préparation en cours",
  READY_FOR_DELIVERY: "Prête pour l'expédition",
  IN_TRANSIT: "En cours de livraison",
  DELIVERED: "Livrée",
  CANCELLED: "Commande annulée",
  REFUNDED: "Commande remboursée",
  FAILED: "Échec de livraison",
};

/** Statut de livraison correspondant à chaque statut de commande. */
const DELIVERY_STATUS_FOR_ORDER: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: "CONFIRMED",
  PREPARING: "PREPARING",
  READY_FOR_DELIVERY: "READY",
  IN_TRANSIT: "IN_TRANSIT",
  DELIVERED: "DELIVERED",
};

async function currentStatus(orderId: string): Promise<OrderStatus> {
  const fresh = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  return (fresh?.status ?? "CANCELLED") as OrderStatus;
}

/**
 * Changement de statut « simple » (préparation, expédition, livraison).
 * Les statuts qui touchent à l'argent ou au stock sont routés vers leur
 * fonction dédiée : annulation, remboursement et paiement ne passent JAMAIS
 * par un simple update de statut (sinon le stock n'est pas restitué).
 * La bascule est conditionnelle au statut lu (updateMany) : deux requêtes
 * concurrentes ne peuvent pas toutes deux réussir.
 */
export async function transitionOrder(orderId: string, to: OrderStatus, note?: string): Promise<OrderChange> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, number: true, status: true, isPaid: true, paymentMethod: true },
  });
  if (!order) throw new Error("Commande introuvable.");

  if (to === "CANCELLED") return cancelOrder(order.number, note);
  if (to === "REFUNDED") return refundOrder(order.number, note);
  if (to === "PAID") return markOrderPaid(order.number, { source: "manual" });

  const from = order.status as OrderStatus;
  if (from === to) return { changed: false, status: from };
  if (!canTransition(from, to)) {
    throw new Error(`Transition invalide : ${from} → ${to}`);
  }

  // Un paiement à la livraison est encaissé à la remise du colis.
  const cashCollected = to === "DELIVERED" && order.paymentMethod === "cash" && !order.isPaid;
  const deliveryStatus = DELIVERY_STATUS_FOR_ORDER[to];

  await prisma.$transaction(async (tx) => {
    const claim = await tx.order.updateMany({
      where: { id: order.id, status: from },
      data: {
        status: to,
        ...(cashCollected ? { isPaid: true, paidAt: new Date() } : {}),
      },
    });
    if (claim.count === 0) throw new OrderConflictError();

    if (cashCollected) {
      await tx.payment.updateMany({
        where: { orderId: order.id },
        data: { status: "PAID", paidAt: new Date() },
      });
    }
    if (deliveryStatus) {
      await tx.delivery.updateMany({
        where: { orderId: order.id },
        data: { status: deliveryStatus, ...(to === "DELIVERED" ? { deliveredAt: new Date() } : {}) },
      });
    }
    await tx.orderEvent.create({
      data: { orderId: order.id, status: to, label: STATUS_LABELS[to] ?? to, note: note ?? null },
    });
  });

  return { changed: true, status: to };
}

/**
 * Validation du paiement.
 * `source = "webhook"` (fiable) ou `"verify"` (interrogation du prestataire).
 * Jamais la simple redirection du navigateur : la visite du client sur
 * /confirmation n'a aucun effet sur le statut.
 *
 * Atomique et idempotent : la bascule PENDING_PAYMENT → PAID est une écriture
 * conditionnelle, donc deux webhooks simultanés ne produisent qu'un seul effet.
 * Si le prestataire annonce un montant, il doit égaler le total de la commande.
 */
export async function markOrderPaid(
  orderNumber: string,
  opts: { providerRef?: string; amount?: number; source?: "webhook" | "verify" | "manual" } = {},
): Promise<OrderChange> {
  const order = await prisma.order.findUnique({
    where: { number: orderNumber },
    include: { payment: true },
  });
  if (!order) throw new Error("Commande introuvable.");
  const current = order.status as OrderStatus;

  // Idempotence : un webhook rejoué ne produit aucun effet de bord.
  if (decidePaymentApplication(order) !== "APPLY") {
    return { changed: false, status: current };
  }

  // Si la référence de transaction est fournie, elle doit correspondre.
  if (opts.providerRef && order.payment?.providerRef && order.payment.providerRef !== opts.providerRef) {
    throw new PaymentError("Référence de paiement incohérente.", "REF_MISMATCH");
  }
  // Un paiement partiel ou surévalué ne valide jamais la commande.
  if (opts.amount !== undefined && opts.amount !== order.total) {
    throw new PaymentError("Le montant payé ne correspond pas au total de la commande.", "AMOUNT_MISMATCH");
  }

  const applied = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const claim = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING_PAYMENT", isPaid: false },
      data: { status: "PAID", isPaid: true, paidAt: now },
    });
    if (claim.count === 0) return false; // un autre traitement est passé avant nous

    await tx.payment.updateMany({
      where: { orderId: order.id },
      data: { status: "PAID", paidAt: now },
    });
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        status: "PAID",
        label: "Paiement confirmé",
        note: `Source : ${opts.source ?? "webhook"}`,
      },
    });
    return true;
  });

  if (!applied) return { changed: false, status: await currentStatus(order.id) };
  return { changed: true, status: "PAID" };
}

/**
 * Paiement échoué ou abandonné (webhook FAILED / CANCELLED) : la commande est
 * annulée et le stock réservé est restitué. Sans effet sur une commande déjà payée.
 */
export async function markPaymentFailed(
  orderNumber: string,
  opts: { providerRef?: string; status?: "FAILED" | "CANCELLED"; reason?: string } = {},
): Promise<OrderChange> {
  const order = await prisma.order.findUnique({
    where: { number: orderNumber },
    include: { payment: true },
  });
  if (!order) throw new Error("Commande introuvable.");
  const current = order.status as OrderStatus;

  if (order.isPaid || current !== "PENDING_PAYMENT") return { changed: false, status: current };
  if (opts.providerRef && order.payment?.providerRef && order.payment.providerRef !== opts.providerRef) {
    throw new PaymentError("Référence de paiement incohérente.", "REF_MISMATCH");
  }

  return cancelOrder(orderNumber, opts.reason ?? "Paiement échoué ou abandonné", {
    paymentStatus: opts.status ?? "FAILED",
    failureReason: opts.reason,
  });
}

/** Point d'entrée unique des évènements prestataire (route webhook, simulation sandbox). */
export async function handlePaymentEvent(event: WebhookEvent): Promise<OrderChange> {
  switch (event.status) {
    case "PAID":
      return markOrderPaid(event.orderNumber, {
        providerRef: event.providerRef,
        amount: event.amount,
        source: "webhook",
      });
    case "FAILED":
    case "CANCELLED":
      return markPaymentFailed(event.orderNumber, {
        providerRef: event.providerRef,
        status: event.status,
        reason: event.failureReason,
      });
    default: {
      // PENDING / PROCESSING / REFUNDED : rien à appliquer côté commande.
      const order = await prisma.order.findUnique({ where: { number: event.orderNumber }, select: { status: true } });
      if (!order) throw new Error("Commande introuvable.");
      return { changed: false, status: order.status as OrderStatus };
    }
  }
}

type OrderToClose = Prisma.OrderGetPayload<{ include: { items: true; payment: true; delivery: true } }>;

/**
 * Clôture d'une commande (annulation OU remboursement) — chemin unique, donc
 * stock, paiement, livraison et historique sont toujours cohérents :
 *  - remboursement chez le prestataire si la commande était payée ;
 *  - bascule conditionnelle du statut (anti-concurrence) ;
 *  - stock restitué, sauf si le colis a déjà été livré.
 * Comme CANCELLED et REFUNDED sont terminaux, le stock ne peut être restitué qu'une fois.
 */
async function closeOrder(
  order: OrderToClose,
  to: "CANCELLED" | "REFUNDED",
  opts: { reason?: string; paymentStatus?: "FAILED" | "CANCELLED"; failureReason?: string },
): Promise<OrderChange> {
  const from = order.status as OrderStatus;
  const mustRefund = order.isPaid;

  // Effet externe d'abord : si le prestataire refuse, rien n'est modifié chez nous.
  if (mustRefund && order.payment?.providerRef && order.payment.provider !== "cash") {
    const provider = getPaymentProvider(order.payment.provider);
    const result = await provider.refundPayment(order.payment.providerRef, order.total);
    if (result.status !== "REFUNDED") throw new PaymentError("Le remboursement a échoué.", "REFUND_FAILED");
  }

  await prisma.$transaction(async (tx) => {
    const claim = await tx.order.updateMany({
      where: { id: order.id, status: from },
      data: { status: to, ...(to === "CANCELLED" ? { cancelledAt: new Date() } : {}) },
    });
    if (claim.count === 0) throw new OrderConflictError();

    if (from !== "DELIVERED") {
      const requests = order.items
        .filter((i) => i.productId)
        .map((i) => ({ productId: i.productId as string, variantId: i.variantId, quantity: i.quantity }));
      await restoreStock(tx, requests);
    }

    await tx.payment.updateMany({
      where: { orderId: order.id },
      data: {
        status: mustRefund ? "REFUNDED" : (opts.paymentStatus ?? "CANCELLED"),
        ...(opts.failureReason && !mustRefund ? { failureReason: opts.failureReason } : {}),
      },
    });
    await tx.delivery.updateMany({
      where: { orderId: order.id, status: { not: "DELIVERED" } },
      data: { status: "CANCELLED" },
    });
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        status: to,
        label: to === "REFUNDED" ? STATUS_LABELS.REFUNDED! : mustRefund ? "Commande annulée et remboursée" : STATUS_LABELS.CANCELLED!,
        note: opts.reason ?? null,
      },
    });
  });

  return { changed: true, status: to };
}

async function loadOrderToClose(orderNumber: string): Promise<OrderToClose> {
  const order = await prisma.order.findUnique({
    where: { number: orderNumber },
    include: { items: true, payment: true, delivery: true },
  });
  if (!order) throw new Error("Commande introuvable.");
  return order;
}

/**
 * Annulation : statut + stock restitué + paiement/livraison clôturés. Idempotent.
 * Une commande déjà payée est remboursée en même temps.
 */
export async function cancelOrder(
  orderNumber: string,
  reason?: string,
  opts: { paymentStatus?: "FAILED" | "CANCELLED"; failureReason?: string } = {},
): Promise<OrderChange> {
  const order = await loadOrderToClose(orderNumber);
  const from = order.status as OrderStatus;
  if (from === "CANCELLED") return { changed: false, status: "CANCELLED" };
  if (!canTransition(from, "CANCELLED")) {
    throw new Error(
      from === "DELIVERED"
        ? "Une commande livrée ne peut pas être annulée."
        : `Annulation impossible depuis le statut ${from}.`,
    );
  }
  return closeOrder(order, "CANCELLED", { reason, ...opts });
}

/** Remboursement d'une commande payée (stock restitué sauf si déjà livrée). Idempotent. */
export async function refundOrder(orderNumber: string, reason?: string): Promise<OrderChange> {
  const order = await loadOrderToClose(orderNumber);
  const from = order.status as OrderStatus;
  if (from === "REFUNDED") return { changed: false, status: "REFUNDED" };
  if (!order.isPaid) {
    throw new Error("Cette commande n'a pas été payée : utilisez l'annulation.");
  }
  if (!canTransition(from, "REFUNDED")) {
    throw new Error(`Remboursement impossible depuis le statut ${from}.`);
  }
  return closeOrder(order, "REFUNDED", { reason });
}

/**
 * Libère le stock immobilisé par les commandes jamais payées (§31).
 * Appelée par la route cron, et à la demande quand un stock paraît insuffisant.
 * Retourne le nombre de commandes expirées.
 */
export async function expireUnpaidOrders(
  ttlMinutes: number = Number(process.env.UNPAID_ORDER_TTL_MINUTES) || 30,
): Promise<number> {
  const cutoff = new Date(Date.now() - ttlMinutes * 60_000);
  const stale = await prisma.order.findMany({
    where: { status: "PENDING_PAYMENT", isPaid: false, createdAt: { lt: cutoff } },
    select: { number: true },
    take: 200,
  });

  let released = 0;
  for (const { number } of stale) {
    try {
      const result = await cancelOrder(number, "Paiement non reçu dans le délai imparti", {
        paymentStatus: "FAILED",
        failureReason: "EXPIRED",
      });
      if (result.changed) released++;
    } catch (e) {
      console.error(`[order] expiration de ${number} impossible :`, e);
    }
  }
  return released;
}

// ---------------------------------------------------------------------------
// Lectures
// ---------------------------------------------------------------------------

export type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

export function orderInclude() {
  return ORDER_INCLUDE;
}

export async function getOrderByNumber(number: string) {
  return prisma.order.findUnique({ where: { number }, include: ORDER_INCLUDE });
}

/** Un invité n'accède à sa commande qu'avec son jeton de suivi. */
export async function getOrderForGuest(number: string, guestToken: string) {
  return prisma.order.findFirst({
    where: { number, guestToken, userId: null },
    include: ORDER_INCLUDE,
  });
}

export async function getOrdersForUser(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}
