"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, Check, Minus, Plus, ShieldCheck, ShoppingBasket, Trash2, Truck, MapPin } from "lucide-react";
import { removeFromCartAction, updateCartAction } from "@/actions/cart";
import { useGuestCart } from "@/lib/store/guest-cart";
import { formatFCFA } from "@/lib/utils";
import { EmptyState } from "@/components/ui/feedback";
import { SmartImage } from "@/components/ui/smart-image";
import { SummaryCard } from "@/components/ui/summary-card";
import { PLACEHOLDER_IMAGE } from "@/lib/images";

export interface CartLineView {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  image: string;
  unit: string;
  producerName: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  compareAtPrice?: number | null;
}

/**
 * Progression vers la livraison offerte. Le seuil vient de la zone de livraison (base de données),
 * jamais d'une valeur codée en dur dans l'interface.
 */
function FreeShippingBar({ subtotal, threshold, city }: { subtotal: number; threshold: number; city: string }) {
  const target = Math.min(100, Math.round((subtotal / threshold) * 100));
  const [width, setWidth] = useState(0);
  // Part de 0 puis remplit : la barre « se charge » à l'ouverture et à chaque ajout.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setWidth(target));
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const remaining = Math.max(0, threshold - subtotal);
  return (
    <div role="status" className="mb-5 rounded-xl border border-sun-200 bg-sun-50 p-4">
      <p className="flex items-center gap-2 text-sm text-brand-950">
        <Truck className="h-4 w-4 shrink-0 text-sun-700" aria-hidden />
        {remaining > 0 ? (
          <span>
            Plus que <strong>{formatFCFA(remaining)}</strong> pour la livraison offerte à {city}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 font-semibold">
            Livraison offerte à {city} <Check className="h-4 w-4 text-forest-600" aria-hidden />
          </span>
        )}
      </p>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-sun-100" aria-hidden>
        <div className="h-full rounded-full bg-sun-500 transition-[width] duration-700 ease-out" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function CartView({
  lines,
  isLoggedIn,
  onGuestChange,
  freeShipping,
}: {
  lines: CartLineView[];
  isLoggedIn: boolean;
  /** Seuil de livraison offerte (FCFA) et ville concernée, issus de la zone de livraison. */
  freeShipping?: { threshold: number; city: string } | null;
  /** Recalcul du total local pour un visiteur. */
  onGuestChange?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const guestSetQuantity = useGuestCart((s) => s.setQuantity);
  const guestRemove = useGuestCart((s) => s.remove);

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBasket className="h-10 w-10" />}
        title="Votre panier est vide"
        description="Parcourez notre catalogue pour découvrir des produits locaux d'Afrique de l'Ouest."
        action={
          <Link href="/produits" className="btn-primary btn-md">
            Découvrir la boutique
          </Link>
        }
      />
    );
  }

  function changeQuantity(line: CartLineView, quantity: number) {
    setError(null);
    if (!isLoggedIn) {
      guestSetQuantity(line.productId, line.variantId, quantity);
      onGuestChange?.();
      return;
    }
    const fd = new FormData();
    fd.set("lineId", line.id);
    fd.set("quantity", String(quantity));
    startTransition(async () => {
      const res = await updateCartAction(fd);
      if (!res.ok) setError(res.error ?? "Impossible de modifier la quantité.");
      else router.refresh();
    });
  }

  function removeLine(line: CartLineView) {
    setError(null);
    if (!isLoggedIn) {
      guestRemove(line.productId, line.variantId);
      onGuestChange?.();
      return;
    }
    const fd = new FormData();
    fd.set("lineId", line.id);
    startTransition(async () => {
      await removeFromCartAction(fd);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        {freeShipping ? <FreeShippingBar subtotal={subtotal} threshold={freeShipping.threshold} city={freeShipping.city} /> : null}

        <ul className="divide-y divide-earth-200 border-y border-earth-200">
          {lines.map((line) => (
            <li key={line.id} className="flex gap-4 py-5 sm:gap-5">
              <Link
                href={`/produits/${line.slug}`}
                className="relative block h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-earth-100 sm:h-32 sm:w-28"
              >
                <SmartImage
                  src={line.image || PLACEHOLDER_IMAGE}
                  alt={line.name}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-sans text-base font-semibold leading-snug tracking-normal text-earth-900">
                      <Link href={`/produits/${line.slug}`} className="hover:text-brand-700">
                        {line.name}
                      </Link>
                    </h2>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-earth-500">
                      <MapPin className="h-3 w-3 text-forest-600" aria-hidden /> {line.producerName}
                    </p>
                    <p className="mt-1 text-xs text-earth-500">
                      {formatFCFA(line.unitPrice)} / {line.unit}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-lg font-bold text-brand-800">
                    {formatFCFA(line.unitPrice * line.quantity)}
                  </p>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                  <div className="inline-flex items-center rounded-full border border-earth-300 bg-white">
                    <button
                      type="button"
                      onClick={() => changeQuantity(line, line.quantity - 1)}
                      disabled={pending}
                      className="rounded-l-full px-3 py-2 text-earth-600 transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:opacity-40"
                      aria-label={`Diminuer la quantité de ${line.name}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-9 px-1 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeQuantity(line, line.quantity + 1)}
                      disabled={pending || line.quantity >= line.availableStock}
                      className="rounded-r-full px-3 py-2 text-earth-600 transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:opacity-40"
                      aria-label={`Augmenter la quantité de ${line.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {line.quantity >= line.availableStock ? (
                      <span className="text-xs font-medium text-sun-700">Stock max : {line.availableStock}</span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removeLine(line)}
                      disabled={pending}
                      className="-mx-2 inline-flex items-center gap-1 px-2 py-2 text-xs font-medium text-earth-600 transition-colors hover:text-kola-600"
                      aria-label={`Retirer ${line.name} du panier`}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Retirer
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {error ? (
          <p role="alert" className="mt-4 rounded-xl border border-kola-100 bg-kola-50 px-4 py-3 text-sm font-medium text-kola-700">
            {error}
          </p>
        ) : null}

        <Link href="/produits" className="mt-4 inline-flex items-center gap-2 py-2 text-sm font-semibold text-brand-700 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Continuer mes achats
        </Link>
      </div>

      <aside className="lg:sticky lg:top-40 lg:h-fit">
        <SummaryCard title="Récapitulatif">
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-earth-600">
              <dt>
                Sous-total ({itemCount} article{itemCount > 1 ? "s" : ""})
              </dt>
              <dd className="font-semibold text-earth-900">{formatFCFA(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-earth-600">
              <dt>Livraison</dt>
              <dd className="text-xs">Calculée à l&apos;étape suivante</dd>
            </div>
          </dl>

          <div className="mt-4 border-t-2 border-dashed border-earth-200 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-earth-900">Total estimé</span>
              <span className="font-display text-2xl font-extrabold text-brand-800">{formatFCFA(subtotal)}</span>
            </div>
            <p className="mt-1 text-[11px] text-earth-500">Frais de livraison et promotions calculés au checkout.</p>
          </div>

          <Link href="/checkout" className="btn-primary btn-lg mt-5 w-full">
            Passer au paiement
          </Link>

          {!isLoggedIn ? (
            <p className="mt-3 text-center text-xs text-earth-500">
              Vous pouvez commander en tant qu&apos;invité ou{" "}
              <Link href="/connexion?callbackUrl=/checkout" className="font-semibold text-brand-700 underline">
                vous connecter
              </Link>{" "}
              pour retrouver votre panier.
            </p>
          ) : null}
        </SummaryCard>

        <ul className="mt-5 space-y-2.5 text-sm text-earth-600">
          <li className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden />
            Paiement Mobile Money, carte ou à la livraison
          </li>
          <li className="flex items-start gap-2.5">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden />
            Livraison offerte selon le montant et la zone
          </li>
          <li className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden />
            Produits traçables jusqu&apos;au producteur
          </li>
        </ul>
      </aside>
    </div>
  );
}
