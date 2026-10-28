"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Panier visiteur (§10) : stockage local via localStorage.
 * À la connexion, ces lignes sont fusionnées avec le panier serveur
 * par `syncGuestCartAction` (jamais de prix acceptés tels quels : le
 * serveur reprend la main au checkout).
 */
export interface GuestLine {
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  image: string;
  unit: string;
  producerName: string;
  unitPrice: number;
  availableStock: number;
  quantity: number;
}

interface GuestCartState {
  lines: GuestLine[];
  add: (line: Omit<GuestLine, "quantity">, quantity: number) => { ok: boolean; message?: string };
  setQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  remove: (productId: string, variantId: string | null) => void;
  clear: () => void;
}

export const useGuestCart = create<GuestCartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (line, quantity) => {
        const existing = get().lines.find(
          (l) => l.productId === line.productId && l.variantId === line.variantId,
        );
        const current = existing?.quantity ?? 0;
        const available = line.availableStock;
        if (current + quantity > available) {
          return {
            ok: false,
            message:
              available <= 0
                ? "Ce produit n'est plus disponible."
                : `Stock insuffisant : il ne reste que ${available} unité(s).`,
          };
        }
        set({
          lines: existing
            ? get().lines.map((l) =>
                l.productId === line.productId && l.variantId === line.variantId
                  ? { ...l, quantity: l.quantity + quantity }
                  : l,
              )
            : [...get().lines, { ...line, quantity }],
        });
        return { ok: true };
      },
      setQuantity: (productId, variantId, quantity) => {
        set({
          lines: get()
            .lines.map((l) =>
              l.productId === productId && l.variantId === variantId
                ? { ...l, quantity: Math.max(0, Math.min(quantity, l.availableStock)) }
                : l,
            )
            .filter((l) => l.quantity > 0),
        });
      },
      remove: (productId, variantId) => {
        set({
          lines: get().lines.filter((l) => !(l.productId === productId && l.variantId === variantId)),
        });
      },
      clear: () => set({ lines: [] }),
    }),
    { name: "afrika-market-cart" },
  ),
);

export const guestCartCount = (lines: GuestLine[]) => lines.reduce((sum, l) => sum + l.quantity, 0);
