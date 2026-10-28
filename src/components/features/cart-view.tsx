"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { removeFromCartAction, updateCartAction } from "@/actions/cart";
import { useGuestCart } from "@/lib/store/guest-cart";
import { formatFCFA } from "@/lib/utils";
import { EmptyState } from "@/components/ui/feedback";

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

export function CartView({
  lines,
  isLoggedIn,
  onGuestChange,
}: {
  lines: CartLineView[];
  isLoggedIn: boolean;
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
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-3">
        {lines.map((line) => (
          <div key={line.id} className="flex gap-4 rounded-2xl border border-earth-200 bg-white p-4">
            <Link href={`/produits/${line.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-earth-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={line.image || "/images/products/placeholder.svg"} alt={line.name} className="h-full w-full object-cover" loading="lazy" />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-earth-900">
                    <Link href={`/produits/${line.slug}`} className="hover:text-brand-700">
                      {line.name}
                    </Link>
                  </h2>
                  <p className="mt-0.5 text-xs text-earth-500">{line.producerName}</p>
                  <p className="mt-1 text-xs text-earth-500">Unité : {line.unit}</p>
                </div>
                <p className="shrink-0 text-sm font-bold text-brand-700">{formatFCFA(line.unitPrice * line.quantity)}</p>
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                <div className="inline-flex items-center rounded-xl border border-earth-300">
                  <button
                    type="button"
                    onClick={() => changeQuantity(line, line.quantity - 1)}
                    disabled={pending}
                    className="px-2.5 py-2 text-earth-600 hover:text-brand-700 disabled:opacity-40"
                    aria-label={`Diminuer la quantité de ${line.name}`}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-8 border-x border-earth-200 px-2 py-2 text-center text-sm font-semibold">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(line, line.quantity + 1)}
                    disabled={pending || line.quantity >= line.availableStock}
                    className="px-2.5 py-2 text-earth-600 hover:text-brand-700 disabled:opacity-40"
                    aria-label={`Augmenter la quantité de ${line.name}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {line.quantity >= line.availableStock ? (
                    <span className="text-xs font-medium text-amber-700">Stock max : {line.availableStock}</span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removeLine(line)}
                    disabled={pending}
                    className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                    aria-label={`Retirer ${line.name} du panier`}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Retirer
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {error ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}
      </div>

      <aside className="lg:sticky lg:top-40 lg:h-fit">
        <div className="rounded-2xl border border-earth-200 bg-white p-5">
          <h2 className="text-base font-bold text-earth-900">Récapitulatif</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-earth-600">
              <dt>Sous-total ({itemCount} article{itemCount > 1 ? "s" : ""})</dt>
              <dd className="font-semibold text-earth-900">{formatFCFA(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-earth-600">
              <dt>Livraison</dt>
              <dd className="text-xs">Calculée à l&apos;étape suivante</dd>
            </div>
          </dl>

          <div className="mt-4 border-t border-earth-100 pt-4">
            <div className="flex justify-between text-base font-bold text-earth-900">
              <span>Total estimé</span>
              <span className="text-brand-700">{formatFCFA(subtotal)}</span>
            </div>
            <p className="mt-1 text-[11px] text-earth-500">Frais de livraison et promotions calculés au checkout.</p>
          </div>

          <Link href="/checkout" className="btn-primary btn-lg mt-4 w-full">
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

          <Link href="/produits" className="mt-3 block text-center text-sm font-medium text-earth-600 hover:text-brand-700">
            ← Continuer mes achats
          </Link>
        </div>

        <ul className="mt-4 space-y-1.5 text-xs text-earth-500">
          <li>✓ Paiement Mobile Money, carte ou à la livraison</li>
          <li>✓ Livraison offerte selon le montant et la zone</li>
          <li>✓ Produits traçables jusqu&apos;au producteur</li>
        </ul>
      </aside>
    </div>
  );
}
