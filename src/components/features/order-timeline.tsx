import { CheckCircle2, Circle } from "lucide-react";
import { formatDateTimeFR } from "@/lib/utils";

export interface OrderEvent {
  id: string;
  status: string;
  label: string;
  note: string | null;
  createdAt: string;
}

const NEGATIVE = ["CANCELLED", "REFUNDED", "FAILED"];

/** Frise de suivi de commande (§16 et §42 — parcours préparation → livraison). */
export function OrderTimeline({ events }: { events: OrderEvent[] }) {
  const sorted = [...events].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <ol className="relative space-y-5 border-l border-earth-200 pl-6">
      {sorted.map((e, i) => {
        const isLast = i === sorted.length - 1;
        const negative = NEGATIVE.includes(e.status);
        return (
          <li key={e.id} className="relative">
            <span
              className={
                negative
                  ? "absolute -left-[1.9rem] flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600"
                  : isLast
                    ? "absolute -left-[1.9rem] flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700"
                    : "absolute -left-[1.9rem] flex h-6 w-6 items-center justify-center rounded-full bg-forest-100 text-forest-700"
              }
              aria-hidden
            >
              {isLast ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
            </span>
            <p className="text-sm font-semibold text-earth-900">{e.label}</p>
            <p className="text-xs text-earth-500">{formatDateTimeFR(e.createdAt)}</p>
            {e.note ? <p className="mt-0.5 text-xs text-earth-600">{e.note}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
