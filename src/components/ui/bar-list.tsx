import { cn } from "@/lib/utils";

export interface BarItem {
  label: string;
  value: number;
  /** Texte secondaire à droite de la valeur (ex. « 12 u. »). */
  hint?: string;
  /** Classe Tailwind de la barre (par défaut : indigo). */
  barClass?: string;
}

/**
 * Liste à barres proportionnelles : plus lisible qu'un tableau pour comparer des volumes
 * (statuts, moyens de paiement, zones, classements).
 */
export function BarList({
  items,
  format = (n) => String(n),
  ranked = false,
  empty = "Aucune donnée pour le moment.",
}: {
  items: BarItem[];
  format?: (n: number) => string;
  ranked?: boolean;
  empty?: string;
}) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-earth-500">{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <ul className="space-y-3.5">
      {items.map((item, i) => (
        <li key={`${item.label}-${i}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-baseline gap-2">
              {ranked ? <span className="w-4 shrink-0 font-display text-sm font-extrabold text-brand-600">{i + 1}</span> : null}
              <span className="truncate font-medium text-earth-800">{item.label}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-earth-900">
              {format(item.value)}
              {item.hint ? <span className="ml-1.5 text-xs font-normal text-earth-500">{item.hint}</span> : null}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-earth-100" aria-hidden>
            <div
              className={cn("h-full rounded-full", item.barClass ?? "bg-brand-600")}
              style={{ width: `${Math.max(3, Math.round((item.value / max) * 100))}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
