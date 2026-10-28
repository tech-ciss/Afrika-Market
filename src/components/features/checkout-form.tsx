"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useActionState } from "react";
import { Banknote, CheckCircle2, CreditCard, Loader2, MapPin, Smartphone } from "lucide-react";
import { placeOrderAction, quoteOrderAction, type PlaceOrderState, type QuoteState } from "@/actions/checkout";
import { useGuestCart } from "@/lib/store/guest-cart";
import { formatFCFA } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, DELIVERY_METHOD_LABELS } from "@/lib/validations/enums";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/fields";
import { Alert } from "@/components/ui/surfaces";
import type { ZoneWithDistricts } from "@/lib/services/delivery.service";
import type { CartLineView } from "@/components/features/cart-view";

interface AddressView {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string | null;
  street: string;
  additionalInfo: string | null;
  isDefault: boolean;
}

const PAYMENT_METHODS = ["wave", "orange", "mtn", "moov", "card", "cash"] as const;
const DELIVERY_METHODS = ["HOME", "RELAY_POINT", "PICKUP_PRODUCER", "PICKUP_PARTNER"] as const;

export function CheckoutForm({
  user,
  zones,
  addresses,
  lines,
  initialPromo = "",
}: {
  user: { email: string; firstName: string; lastName: string; phone: string | null } | null;
  zones: ZoneWithDistricts[];
  addresses: AddressView[];
  lines: CartLineView[];
  initialPromo?: string;
}) {
  const guestLines = useGuestCart((s) => s.lines);
  const isGuest = !user;

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  const [form, setForm] = useState({
    email: user?.email ?? "",
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    street: defaultAddress?.street ?? "",
    city: defaultAddress?.city ?? "Abidjan",
    district: defaultAddress?.district ?? "",
    neighborhood: defaultAddress?.neighborhood ?? "",
    additionalInfo: defaultAddress?.additionalInfo ?? "",
    note: "",
  });
  const [addressId, setAddressId] = useState<string | null>(defaultAddress?.id ?? null);
  const [zoneId, setZoneId] = useState(zones.find((z) => z.name === form.city)?.id ?? zones[0]?.id ?? "");
  const [deliveryMethod, setDeliveryMethod] = useState<(typeof DELIVERY_METHODS)[number]>("HOME");
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>("wave");
  const [promoCode, setPromoCode] = useState(initialPromo);
  const [quote, setQuote] = useState<QuoteState | null>(null);
  const [quotePending, startQuote] = useTransition();
  const [state, formAction, pending] = useActionState<PlaceOrderState, FormData>(placeOrderAction, null);

  const zone = zones.find((z) => z.id === zoneId) ?? null;
  const items = useMemo(
    () => (isGuest ? guestLines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })) : []),
    [guestLines, isGuest],
  );

  // Le cash n'est pas toujours disponible (§12 et §14).
  useEffect(() => {
    if (paymentMethod === "cash" && zone && !zone.allowCashOnDelivery) setPaymentMethod("wave");
  }, [zone, paymentMethod]);

  // Devis côté serveur : jamais de calcul de prix côté client.
  useEffect(() => {
    const fd = new FormData();
    fd.set("zoneId", zoneId);
    fd.set("deliveryMethod", deliveryMethod);
    fd.set("promoCode", promoCode);
    fd.set("items", JSON.stringify(items));
    startQuote(async () => {
      const result = await quoteOrderAction(fd);
      setQuote(result);
    });
  }, [zoneId, deliveryMethod, promoCode, items]);

  const displayLines = isGuest
    ? guestLines.map((l, i) => ({
        id: `${l.productId}:${i}`,
        name: l.name,
        producerName: l.producerName,
        image: l.image,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
      }))
    : lines.map((l) => ({
        id: l.id,
        name: l.name,
        producerName: l.producerName,
        image: l.image,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
      }));

  if (state?.ok === false && state.field === "cart") {
    return (
      <div className="space-y-4">
        <Alert tone="warning">{state.error}</Alert>
        <Link href="/panier" className="btn-primary btn-md">
          Retour au panier
        </Link>
      </div>
    );
  }

  function applyAddress(addr: AddressView) {
    setAddressId(addr.id);
    setForm((f) => ({
      ...f,
      firstName: addr.firstName,
      lastName: addr.lastName,
      phone: addr.phone,
      city: addr.city,
      district: addr.district,
      neighborhood: addr.neighborhood ?? "",
      street: addr.street,
      additionalInfo: addr.additionalInfo ?? "",
    }));
    const z = zones.find((s) => s.name === addr.city || s.districts.some((d) => d.name === addr.district));
    if (z) setZoneId(z.id);
  }

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Colonne principale */}
      <div className="space-y-5">
        {state?.ok === false ? <Alert tone="error">{state.error}</Alert> : null}

        <section className="rounded-2xl border border-earth-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-earth-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs text-white">1</span>
            Coordonnées
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="E-mail" htmlFor="email" required error={state?.fieldErrors?.email?.[0]}>
              <Input id="email" name="email" type="email" required defaultValue={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} autoComplete="email" />
            </Field>
            <Field label="Téléphone (ex. +225 07 07 07 07 07)" htmlFor="phone" required error={state?.fieldErrors?.phone?.[0]}>
              <Input id="phone" name="phone" required defaultValue={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} autoComplete="tel" placeholder="+225 07 07 07 07 07" />
            </Field>
            <Field label="Prénom" htmlFor="firstName" required error={state?.fieldErrors?.firstName?.[0]}>
              <Input id="firstName" name="firstName" required defaultValue={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} autoComplete="given-name" />
            </Field>
            <Field label="Nom" htmlFor="lastName" required error={state?.fieldErrors?.lastName?.[0]}>
              <Input id="lastName" name="lastName" required defaultValue={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} autoComplete="family-name" />
            </Field>
          </div>
          {isGuest ? (
            <p className="mt-3 text-xs text-earth-500">
              Commandez en invité, ou{" "}
              <Link href="/connexion?callbackUrl=/checkout" className="font-semibold text-brand-700 underline">
                connectez-vous
              </Link>{" "}
              pour retrouver vos commandes et adresses.
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-earth-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-earth-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs text-white">2</span>
            Adresse de livraison
          </h2>

          {addresses.length > 0 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {addresses.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => applyAddress(a)}
                  className={
                    addressId === a.id
                      ? "rounded-xl border-2 border-brand-600 bg-brand-50 p-3 text-left text-sm"
                      : "rounded-xl border border-earth-300 p-3 text-left text-sm hover:border-earth-400"
                  }
                >
                  <span className="font-semibold text-earth-900">{a.label}</span>
                  <span className="mt-0.5 block text-xs text-earth-600">
                    {a.street}, {a.district}, {a.city}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Ville" htmlFor="city" required error={state?.fieldErrors?.city?.[0]}>
              <Select id="city" name="city" value={form.city} onChange={(e) => {
                setForm((f) => ({ ...f, city: e.target.value }));
                const z = zones.find((s) => s.name === e.target.value);
                if (z) setZoneId(z.id);
              }}>
                {zones.map((z) => (
                  <option key={z.id} value={z.name}>
                    {z.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Commune / quartier" htmlFor="district" required error={state?.fieldErrors?.district?.[0]}>
              {zone && zone.districts.length > 0 ? (
                <Select id="district" name="district" value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}>
                  <option value="">Sélectionnez votre commune</option>
                  {zone.districts.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input id="district" name="district" required value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} />
              )}
            </Field>

            <Field label="Rue / repère" htmlFor="street" required error={state?.fieldErrors?.street?.[0]} className="sm:col-span-2">
              <Input id="street" name="street" required defaultValue={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} placeholder="Boulevard Latrille, R+2, porte orange" autoComplete="street-address" />
            </Field>

            <Field label="Quartier (optionnel)" htmlFor="neighborhood">
              <Input id="neighborhood" name="neighborhood" defaultValue={form.neighborhood} onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))} />
            </Field>

            <Field label="Indications pour le livreur (optionnel)" htmlFor="additionalInfo">
              <Input id="additionalInfo" name="additionalInfo" defaultValue={form.additionalInfo} onChange={(e) => setForm((f) => ({ ...f, additionalInfo: e.target.value }))} placeholder="À côté de la pharmacie…" />
            </Field>
          </div>

          {addressId ? <input type="hidden" name="addressId" value={addressId} /> : null}
        </section>

        <section className="rounded-2xl border border-earth-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-earth-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs text-white">3</span>
            Mode de livraison
          </h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {DELIVERY_METHODS.map((m) => {
              const fee = m === "PICKUP_PRODUCER" || m === "PICKUP_PARTNER" ? 0 : zone?.basePrice ?? 0;
              return (
                <label
                  key={m}
                  className={
                    deliveryMethod === m
                      ? "flex cursor-pointer items-start gap-3 rounded-xl border-2 border-brand-600 bg-brand-50 p-3"
                      : "flex cursor-pointer items-start gap-3 rounded-xl border border-earth-300 p-3 hover:border-earth-400"
                  }
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value={m}
                    checked={deliveryMethod === m}
                    onChange={() => setDeliveryMethod(m)}
                    className="mt-1 h-4 w-4 border-earth-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-earth-900">{DELIVERY_METHOD_LABELS[m]}</span>
                    <span className="block text-xs text-earth-600">
                      {fee === 0 ? "Gratuit" : `à partir de ${formatFCFA(fee)}`} · {zone?.estimatedDays ?? 1} jour(s)
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {zones.map((z) => (
              <label
                key={z.id}
                className={
                  zoneId === z.id
                    ? "flex cursor-pointer items-start gap-3 rounded-xl border-2 border-brand-600 bg-brand-50 p-3"
                    : "flex cursor-pointer items-start gap-3 rounded-xl border border-earth-300 p-3 hover:border-earth-400"
                }
              >
                <input
                  type="radio"
                  name="zoneId"
                  value={z.id}
                  checked={zoneId === z.id}
                  onChange={() => setZoneId(z.id)}
                  className="mt-1 h-4 w-4 border-earth-300 text-brand-600 focus:ring-brand-500"
                />
                <span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-earth-900">
                    <MapPin className="h-3.5 w-3.5" aria-hidden /> {z.name}
                  </span>
                  <span className="block text-xs text-earth-600">
                    {z.basePrice === 0 ? "Retrait gratuit" : formatFCFA(z.basePrice)}
                    {z.freeFrom ? ` · offerte dès ${formatFCFA(z.freeFrom)}` : ""}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-earth-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-earth-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs text-white">4</span>
            Paiement
          </h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PAYMENT_METHODS.map((m) => {
              const disabled = m === "cash" && zone ? !zone.allowCashOnDelivery : false;
              return (
                <label
                  key={m}
                  className={
                    disabled
                      ? "flex cursor-not-allowed items-start gap-3 rounded-xl border border-earth-200 bg-earth-50 p-3 opacity-60"
                      : paymentMethod === m
                        ? "flex cursor-pointer items-start gap-3 rounded-xl border-2 border-brand-600 bg-brand-50 p-3"
                        : "flex cursor-pointer items-start gap-3 rounded-xl border border-earth-300 p-3 hover:border-earth-400"
                  }
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={m}
                    checked={paymentMethod === m}
                    disabled={disabled}
                    onChange={() => setPaymentMethod(m)}
                    className="mt-1 h-4 w-4 border-earth-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-earth-900">
                      {m === "cash" ? <Banknote className="h-4 w-4" /> : m === "card" ? <CreditCard className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                      {PAYMENT_METHOD_LABELS[m]}
                    </span>
                    {disabled ? <span className="block text-xs text-earth-500">Indisponible dans cette zone</span> : null}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-4">
            <Field label="Note pour la commande (optionnel)" htmlFor="note">
              <Textarea id="note" name="note" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className="min-h-20" />
            </Field>
          </div>
        </section>
      </div>

      {/* Récapitulatif */}
      <aside className="lg:sticky lg:top-40 lg:h-fit">
        <div className="rounded-2xl border border-earth-200 bg-white p-5">
          <h2 className="text-base font-bold text-earth-900">Votre commande</h2>

          <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
            {displayLines.map((l) => (
              <li key={l.id} className="flex items-center gap-3">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-earth-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.image || "/images/products/placeholder.svg"} alt="" className="h-full w-full object-cover" loading="lazy" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-earth-900">{l.name}</span>
                  <span className="block text-xs text-earth-500">
                    {l.quantity} × {formatFCFA(l.unitPrice)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-earth-900">
                  {formatFCFA(l.unitPrice * l.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-earth-100 pt-4">
            <label htmlFor="promoCode" className="mb-1.5 block text-sm font-medium text-earth-800">
              Code promotionnel
            </label>
            <div className="flex gap-2">
              <Input id="promoCode" name="promoCode" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="BIENVENUE10" />
              <Button type="button" variant="secondary" onClick={() => setPromoCode(promoCode.trim())} disabled={quotePending}>
                {quotePending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Appliquer"}
              </Button>
            </div>
            {quote?.promoMessage ? (
              <p className={`mt-1.5 text-xs font-medium ${quote.promoOk ? "text-forest-700" : "text-red-600"}`} role="status">
                {quote.promoMessage}
              </p>
            ) : null}
          </div>

          <dl className="mt-4 space-y-2 border-t border-earth-100 pt-4 text-sm">
            <div className="flex justify-between text-earth-600">
              <dt>Sous-total</dt>
              <dd className="font-semibold text-earth-900">{formatFCFA(quote?.subtotal ?? 0)}</dd>
            </div>
            {quote && quote.discount > 0 ? (
              <div className="flex justify-between text-forest-700">
                <dt>Remise ({promoCode})</dt>
                <dd className="font-semibold">-{formatFCFA(quote.discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between text-earth-600">
              <dt>
                Livraison {zone ? `· ${zone.name}` : ""}
                {quote?.freeReason ? <span className="text-forest-700"> (offerte)</span> : null}
              </dt>
              <dd className="font-semibold text-earth-900">{formatFCFA(quote?.shipping ?? 0)}</dd>
            </div>
            <div className="flex justify-between border-t border-earth-100 pt-3 text-base font-bold text-earth-900">
              <dt>Total</dt>
              <dd className="text-brand-700">{formatFCFA(quote?.total ?? 0)}</dd>
            </div>
          </dl>

          <p className="mt-1 text-right text-[11px] text-earth-500">Montants recalculés et vérifiés côté serveur.</p>

          <Button type="submit" size="lg" className="mt-4 w-full" disabled={pending || displayLines.length === 0}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Traitement…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Confirmer la commande
              </>
            )}
          </Button>

          {isGuest ? <input type="hidden" name="items" value={JSON.stringify(items)} /> : null}

          <p className="mt-3 text-center text-[11px] leading-relaxed text-earth-500">
            En confirmant, vous acceptez nos conditions générales de vente. Paiement {PAYMENT_METHOD_LABELS[paymentMethod]}.
          </p>
        </div>
      </aside>
    </form>
  );
}
