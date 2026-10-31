import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Panier", "Livraison et paiement", "Confirmation"] as const;

/**
 * Indicateur d'étapes du parcours d'achat (§11 et §42).
 * Sur mobile, seul le libellé de l'étape en cours est affiché pour tenir sur une ligne.
 */
export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="mb-8 flex items-center text-sm" aria-label="Étapes de la commande">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "current" : "todo";
        return (
          <li key={label} className="flex items-center" aria-current={state === "current" ? "step" : undefined}>
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                state === "done" && "bg-forest-600 text-white",
                state === "current" && "bg-brand-800 text-sun-400",
                state === "todo" && "border border-earth-300 bg-white text-earth-500",
              )}
            >
              {state === "done" ? <Check className="h-4 w-4" aria-label="Étape terminée" /> : n}
            </span>
            <span
              className={cn(
                "ml-2.5",
                state === "current" ? "font-semibold text-brand-950" : "hidden text-earth-500 sm:inline",
              )}
            >
              {label}
            </span>
            {n < STEPS.length ? (
              <span aria-hidden className="mx-3 w-6 border-t-2 border-dashed border-brand-200 sm:mx-4 sm:w-14" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
