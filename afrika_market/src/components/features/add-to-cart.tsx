"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, ShoppingBasket, Check, AlertCircle, Heart } from "lucide-react";
import { addToCartAction } from "@/actions/cart";
import { toggleWishlistAction } from "@/actions/account";
import { useGuestCart } from "@/lib/store/guest-cart";
import { formatFCFA } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface AddToCartProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  unit: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  lowStockThreshold: number;
  producerName: string;
}

export interface AddToCartVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export function AddToCart({
  product,
  variants = [],
  isLoggedIn,
  inWishlist = false,
  compact = false,
}: {
  product: AddToCartProduct;
  variants?: AddToCartVariant[];
  isLoggedIn: boolean;
  inWishlist?: boolean;
  compact?: boolean;
}) {
  const [variantId, setVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [wishlist, setWishlist] = useState(inWishlist);
  const [pending, startTransition] = useTransition();
  const guestAdd = useGuestCart((s) => s.add);

  const variant = variants.find((v) => v.id === variantId) ?? null;
  const price = variant?.price ?? product.price;
  const stock = variant ? variant.stock : product.stock;
  const soldOut = stock <= 0;
  const lowStock = !soldOut && stock <= product.lowStockThreshold;

  function handleAdd() {
    if (soldOut) return;
    setMessage(null);

    if (isLoggedIn) {
      const fd = new FormData();
      fd.set("productId", product.id);
      fd.set("variantId", variantId ?? "");
      fd.set("quantity", String(quantity));
      startTransition(async () => {
        const res = await addToCartAction(fd);
        if (res.ok) setMessage({ type: "success", text: "Ajouté au panier" });
        else setMessage({ type: "error", text: res.error ?? "Impossible d'ajouter ce produit." });
      });
      return;
    }

    const res = guestAdd(
      {
        productId: product.id,
        variantId,
        name: product.name,
        slug: product.slug,
        image: product.image,
        unit: product.unit,
        producerName: product.producerName,
        unitPrice: price,
        availableStock: stock,
      },
      quantity,
    );
    setMessage(
      res.ok
        ? { type: "success", text: "Ajouté au panier (panier invité)" }
        : { type: "error", text: res.message ?? "Impossible d'ajouter ce produit." },
    );
  }

  function handleWishlist() {
    startTransition(async () => {
      const res = await toggleWishlistAction(product.id);
      if (res.ok) setWishlist(!!res.inWishlist);
    });
  }

  if (compact) {
    return (
      <Button onClick={handleAdd} disabled={soldOut || pending} className="w-full" size="md">
        <ShoppingBasket className="h-4 w-4" />
        {soldOut ? "Rupture de stock" : pending ? "Ajout…" : "Ajouter au panier"}
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          {product.compareAtPrice && product.compareAtPrice > price ? (
            <p className="text-sm text-earth-500 line-through">{formatFCFA(product.compareAtPrice)}</p>
          ) : null}
          <p className="text-3xl font-extrabold tracking-tight text-brand-700">{formatFCFA(price)}</p>
          <p className="text-sm text-earth-500">par {product.unit} · TTC</p>
        </div>
        <span
          className={
            soldOut
              ? "rounded-full bg-earth-100 px-3 py-1 text-xs font-semibold text-earth-600"
              : lowStock
                ? "rounded-full bg-sun-50 px-3 py-1 text-xs font-semibold text-sun-700"
                : "rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold text-forest-700"
          }
        >
          {soldOut ? "Rupture de stock" : lowStock ? `Plus que ${stock} en stock` : `${stock} disponibles`}
        </span>
      </div>

      {variants.length > 1 ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-earth-800">Format</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                disabled={v.stock <= 0}
                aria-pressed={variantId === v.id}
                className={
                  variantId === v.id
                    ? "rounded-xl border-2 border-brand-600 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800"
                    : "rounded-xl border border-earth-300 bg-white px-3 py-2 text-sm text-earth-700 hover:border-earth-400 disabled:opacity-40"
                }
              >
                {v.name}
                <span className="ml-2 text-xs text-earth-500">{formatFCFA(v.price)}</span>
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-xl border border-earth-300 bg-white">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2.5 text-earth-600 hover:text-brand-700 disabled:opacity-40"
            aria-label="Diminuer la quantité"
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            min={1}
            max={Math.max(stock, 1)}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(Number(e.target.value) || 1, Math.max(stock, 1))))}
            aria-label="Quantité"
            className="w-14 border-x border-earth-200 bg-transparent py-2.5 text-center text-sm font-semibold focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(Math.max(stock, 1), q + 1))}
            className="px-3 py-2.5 text-earth-600 hover:text-brand-700 disabled:opacity-40"
            aria-label="Augmenter la quantité"
            disabled={quantity >= stock}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <Button onClick={handleAdd} disabled={soldOut || pending} size="lg" className="flex-1 sm:flex-none sm:px-8">
          <ShoppingBasket className="h-5 w-5" />
          {soldOut ? "Indisponible" : pending ? "Ajout en cours…" : "Ajouter au panier"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={handleWishlist}
          disabled={pending}
          aria-pressed={wishlist}
          aria-label={wishlist ? "Retirer de la liste d'envies" : "Ajouter à la liste d'envies"}
        >
          <Heart className={wishlist ? "h-5 w-5 fill-kola-500 text-kola-600" : "h-5 w-5"} />
        </Button>
      </div>

      {message ? (
        <p
          role="status"
          className={
            message.type === "success"
              ? "flex items-center gap-2 text-sm font-medium text-forest-700"
              : "flex items-center gap-2 text-sm font-medium text-kola-600"
          }
        >
          {message.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
