import Link from "next/link";
import { cn } from "@/lib/utils";

export interface FilterChip {
  key: string;
  label: string;
  href: string;
  count?: number;
  active: boolean;
}

/** Filtres en pastilles (liens), avec compteur optionnel : défilent horizontalement sur mobile. */
export function FilterChips({ items, label }: { items: FilterChip[]; label: string }) {
  return (
    <nav aria-label={label} className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      {items.map((f) => (
        <Link
          key={f.key}
          href={f.href}
          aria-current={f.active ? "page" : undefined}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            f.active
              ? "border-brand-800 bg-brand-800 text-white"
              : "border-earth-300 bg-white text-earth-700 hover:border-brand-300 hover:bg-brand-50",
          )}
        >
          {f.label}
          {f.count !== undefined ? (
            <span className={cn("text-xs tabular-nums", f.active ? "text-sun-300" : "text-earth-500")}>{f.count}</span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

/** Champ de recherche GET (sans JavaScript) : conserve les autres paramètres via des champs cachés. */
export function SearchBox({
  action,
  defaultValue,
  placeholder,
  hidden,
}: {
  action: string;
  defaultValue?: string;
  placeholder: string;
  hidden?: Record<string, string | undefined>;
}) {
  return (
    <form action={action} className="mb-4 flex gap-2">
      {Object.entries(hidden ?? {}).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <label htmlFor="q" className="sr-only">
        Rechercher
      </label>
      <input
        id="q"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-full border border-earth-300 bg-white px-5 py-2.5 text-sm placeholder:text-earth-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 sm:max-w-sm"
      />
      <button type="submit" className="btn-secondary btn-md">
        Rechercher
      </button>
    </form>
  );
}
