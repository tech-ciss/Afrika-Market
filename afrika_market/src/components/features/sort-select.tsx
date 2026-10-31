"use client";

import { useRouter } from "next/navigation";
import { ArrowDownUp } from "lucide-react";
import { type SortKey } from "@/lib/services/catalog.service";

const LABELS: Record<SortKey, string> = {
  relevance: "Pertinence",
  "price-asc": "Prix croissant",
  "price-desc": "Prix décroissant",
  newest: "Nouveautés",
  rating: "Meilleures notes",
  sales: "Meilleures ventes",
};

export function SortSelect({ value }: { value: SortKey }) {
  const router = useRouter();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-earth-600">
      <ArrowDownUp className="h-4 w-4" aria-hidden />
      <span className="sr-only sm:not-sr-only">Trier par</span>
      <select
        value={value}
        onChange={(e) => {
          const params = new URLSearchParams(window.location.search);
          if (e.target.value === "relevance") params.delete("tri");
          else params.set("tri", e.target.value);
          params.delete("page");
          router.push(`/produits?${params.toString()}`);
        }}
        className="rounded-xl border border-earth-300 bg-white px-3 py-2 text-sm font-medium text-earth-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        aria-label="Trier les produits"
      >
        {(Object.keys(LABELS) as SortKey[]).map((k) => (
          <option key={k} value={k}>
            {LABELS[k]}
          </option>
        ))}
      </select>
    </label>
  );
}
