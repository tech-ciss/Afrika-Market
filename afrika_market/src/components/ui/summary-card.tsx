import * as React from "react";
import { cn } from "@/lib/utils";

/** Carte de récapitulatif (panier, checkout) : bandeau tissé, titre, contenu. */
export function SummaryCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-earth-200 bg-white", className)}>
      <div className="weave-soft" aria-hidden />
      <div className="p-5">
        <h2 className="font-display text-xl font-bold text-brand-950">{title}</h2>
        {children}
      </div>
    </div>
  );
}
