"use client";

import { useGuestCart } from "@/lib/store/guest-cart";
import { CartView } from "@/components/features/cart-view";
import { useEffect, useState } from "react";

/** Panier visiteur : lecture du localStorage (Zustand persist). */
export function GuestCart() {
  const lines = useGuestCart((s) => s.lines);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-40 animate-pulse rounded-2xl bg-earth-100" aria-hidden />;
  }

  return (
    <CartView
      isLoggedIn={false}
      onGuestChange={() => undefined}
      lines={lines.map((l, i) => ({
        id: `${l.productId}:${l.variantId ?? "base"}:${i}`,
        productId: l.productId,
        variantId: l.variantId,
        name: l.name,
        slug: l.slug,
        image: l.image,
        unit: l.unit,
        producerName: l.producerName,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        availableStock: l.availableStock,
      }))}
    />
  );
}
