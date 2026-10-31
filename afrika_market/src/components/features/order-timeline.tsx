import { Check, X } from "lucide-react";
import { formatDateTimeFR } from "@/lib/utils";

export interface OrderEvent {
  id: string;
  status: string;
  label: string;
  note: string | null;
  createdAt: string;
}

const NEGATIVE = ["CANCELLED", "REFUNDED", "FAILED"];

/**
 * Frise de suivi de commande (§16 et §42 — parcours préparation → livraison).
 * Étapes passées : vertes ; étape en cours : jaune cajou ; annulation / remboursement : rouge kola.
 */
export function OrderTimeline({ events }: { events: OrderEvent[] }) {
  const sorted = [...events].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <ol className="relative space-y-6 border-l-2 border-dashed border-brand-200 pl-8">
      {sorted.map((e, i) => {
        const isLast = i === sorted.length - 1;
        const negative = NEGATIVE.includes(e.status);
        return (
          <li key={e.id} className="relative">
            <span
              className={
                negative
                  ? "absolute -left-[2.65rem] flex h-7 w-7 items-center justify-center rounded-full bg-kola-500 text-white"
                  : isLast
                    ? "absolute -left-[2.65rem] flex h-7 w-7 items-center justify-center rounded-full bg-sun-400 text-brand-950 ring-4 ring-sun-100"
                    : "absolute -left-[2.65rem] flex h-7 w-7 items-center justify-center rounded-full bg-forest-600 text-white"
              }
              aria-hidden
            >
              {negative ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            </span>
            <p className={isLast ? "text-sm font-bold text-brand-950" : "text-sm font-semibold text-earth-800"}>{e.label}</p>
            <p className="text-xs text-earth-500">{formatDateTimeFR(e.createdAt)}</p>
            {e.note ? <p className="mt-0.5 text-xs text-earth-600">{e.note}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
