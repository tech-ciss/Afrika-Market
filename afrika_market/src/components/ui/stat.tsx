import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Bandeau de chiffres clés : plusieurs valeurs dans UNE carte séparée par des filets
 * (plutôt qu'une grille de cartes identiques).
 */
export function StatStrip({ items, className }: { items: { label: string; value: string; hint?: string }[]; className?: string }) {
  return (
    <dl
      className={cn(
        "grid divide-y divide-earth-200 overflow-hidden rounded-2xl border border-earth-200 bg-white sm:divide-x sm:divide-y-0",
        items.length === 2 && "sm:grid-cols-2",
        items.length === 3 && "sm:grid-cols-3",
        items.length === 4 && "sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="p-5">
          <dt className="text-sm text-earth-600">{item.label}</dt>
          <dd className="mt-1 font-display text-3xl font-extrabold tracking-tight text-brand-900">{item.value}</dd>
          {item.hint ? <p className="mt-1 text-xs text-earth-500">{item.hint}</p> : null}
        </div>
      ))}
    </dl>
  );
}

/** Tableau de données habillé : conteneur arrondi, défilement horizontal sur mobile. */
export function DataTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-earth-200 bg-white", className)}>
      <table className="w-full min-w-[34rem] text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, align = "left" }: { children?: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th scope="col" className={cn("bg-earth-50 px-4 py-3 text-xs font-semibold text-earth-600", align === "right" ? "text-right" : "text-left")}>
      {children}
    </th>
  );
}
