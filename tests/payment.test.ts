import { describe, expect, it, vi } from "vitest";
import {
  decidePaymentApplication,
  getPaymentProvider,
  signWebhookPayload,
  SandboxPaymentProvider,
  type CreatePaymentInput,
} from "@/lib/services/payment.service";

const provider = new SandboxPaymentProvider();

const input: CreatePaymentInput = {
  orderId: "ord_1",
  orderNumber: "AM-20261027-00001",
  amount: 12500,
  currency: "XOF",
  method: "wave",
  customer: { email: "client@mail.ci", phone: "+225 07 07 07 07 07", name: "Aya Kouassi" },
};

describe("paiement — création", () => {
  it("crée un paiement en attente avec une référence", async () => {
    const result = await provider.createPayment(input);
    expect(result.status).toBe("PENDING");
    expect(result.providerRef).toMatch(/^SBX-/);
  });

  it("expose un fournisseur par moyen de paiement", () => {
    for (const method of ["wave", "orange", "mtn", "moov", "card", "cash"] as const) {
      expect(getPaymentProvider(method).code).toBe(method);
    }
  });

  it("retombe sur le fournisseur de démonstration", () => {
    expect(getPaymentProvider("inconnu").code).toBe("sandbox");
  });
});

describe("paiement — vérification", () => {
  it("renvoie PENDING tant que le prestataire n'a pas confirmé", async () => {
    const { providerRef } = await provider.createPayment(input);
    const result = await provider.verifyPayment(providerRef);
    expect(result.status).toBe("PROCESSING");
  });

  it("renvoie PAID lorsque le prestataire confirme", async () => {
    const result = await provider.verifyPayment("SBX-PAID-1234");
    expect(result.status).toBe("PAID");
    expect(result.paidAt).toBeInstanceOf(Date);
  });

  it("rembourse un paiement", async () => {
    const result = await provider.refundPayment("SBX-PAID-1234");
    expect(result.status).toBe("REFUNDED");
  });
});

describe("paiement — webhook", () => {
  const body = JSON.stringify({
    orderNumber: "AM-20261027-00001",
    providerRef: "SBX-ABC",
    status: "PAID",
    amount: 12500,
  });

  it("accepte une signature valide", () => {
    expect(provider.verifyWebhookSignature(body, signWebhookPayload(body))).toBe(true);
  });

  it("rejette une signature absente ou falsifiée", () => {
    expect(provider.verifyWebhookSignature(body, "")).toBe(false);
    expect(provider.verifyWebhookSignature(body, "a".repeat(64))).toBe(false);
  });

  it("rejette un payload altéré après signature", () => {
    const tampered = body.replace("12500", "1");
    expect(provider.verifyWebhookSignature(tampered, signWebhookPayload(body))).toBe(false);
  });

  it("parse un évènement valide", () => {
    const event = provider.parseWebhook(body);
    expect(event).toMatchObject({ orderNumber: "AM-20261027-00001", status: "PAID" });
  });

  it("refuse un payload malformé", () => {
    expect(provider.parseWebhook("pas du json")).toBeNull();
    expect(provider.parseWebhook("{}")).toBeNull();
    expect(provider.parseWebhook(JSON.stringify({ orderNumber: "x" }))).toBeNull();
  });
});

describe("paiement — idempotence du webhook (§40)", () => {
  it("applique la première confirmation", () => {
    expect(decidePaymentApplication({ status: "PENDING_PAYMENT", isPaid: false })).toBe("APPLY");
  });

  it("ignore un webhook reçu une seconde fois", () => {
    expect(decidePaymentApplication({ status: "PAID", isPaid: true })).toBe("IGNORE_ALREADY_PAID");
  });

  it("ignore une confirmation sur une commande annulée", () => {
    expect(decidePaymentApplication({ status: "CANCELLED", isPaid: false })).toBe("IGNORE_WRONG_STATE");
  });

  it("ignore une confirmation sur une commande déjà confirmée", () => {
    expect(decidePaymentApplication({ status: "CONFIRMED", isPaid: false })).toBe("IGNORE_WRONG_STATE");
  });
});

describe("paiement — fournisseur configurable", () => {
  it("délègue au fournisseur embarqué", async () => {
    const delegate = { createPayment: vi.fn().mockResolvedValue({ providerRef: "X", status: "PENDING" }) };
    const { ConfigurableProvider } = await import("@/lib/services/payment.service");
    const custom = new ConfigurableProvider("wave", "Wave", delegate as never);
    const result = await custom.createPayment(input);
    expect(result.providerRef).toBe("X");
    expect(delegate.createPayment).toHaveBeenCalledOnce();
  });
});

describe("paiement — durcissement du webhook", () => {
  it("rejette un statut inconnu", () => {
    const body = JSON.stringify({ orderNumber: "AM-1", providerRef: "SBX-1", status: "SUPER_PAYE" });
    expect(provider.parseWebhook(body)).toBeNull();
  });

  it("transmet le montant annoncé par le prestataire", () => {
    const body = JSON.stringify({ orderNumber: "AM-1", providerRef: "SBX-1", status: "PAID", amount: 12500 });
    expect(provider.parseWebhook(body)?.amount).toBe(12500);
  });

  it("génère des références uniques et imprévisibles", async () => {
    const refs = await Promise.all(Array.from({ length: 20 }, () => provider.createPayment(input)));
    expect(new Set(refs.map((r) => r.providerRef)).size).toBe(20);
  });

  it("refuse toute signature en production sans PAYMENT_WEBHOOK_SECRET", () => {
    const env = process.env as Record<string, string | undefined>;
    const saved = { node: env.NODE_ENV, secret: env.PAYMENT_WEBHOOK_SECRET };
    env.NODE_ENV = "production";
    delete env.PAYMENT_WEBHOOK_SECRET;
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(provider.verifyWebhookSignature("{}", "a".repeat(64))).toBe(false);
    } finally {
      env.NODE_ENV = saved.node;
      if (saved.secret !== undefined) env.PAYMENT_WEBHOOK_SECRET = saved.secret;
      spy.mockRestore();
    }
  });
});
