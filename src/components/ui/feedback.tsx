import * as React from "react";
import Link from "next/link";
import { Star, PackageOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Note moyenne en étoiles (1 à 5), lisible par les lecteurs d'écran. */
export function Stars({
  value,
  size = 14,
  showValue = false,
  className,
}: {
  value: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={cn("inline-flex items-center gap-1", className)} role="img" aria-label={`Note ${value} sur 5`}>
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = rounded >= i;
          const half = !filled && rounded >= i - 0.5;
          return (
            <Star
              key={i}
              width={size}
              height={size}
              className={filled ? "fill-amber-400 text-amber-400" : half ? "fill-amber-400/60 text-amber-300" : "text-earth-300"}
              aria-hidden
            />
          );
        })}
      </span>
      {showValue ? <span className="text-xs font-medium text-earth-600">{value.toFixed(1)}</span> : null}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-earth-300 bg-white px-6 py-14 text-center">
      <div className="mb-3 text-earth-400">{icon ?? <PackageOpen className="h-10 w-10" aria-hidden />}</div>
      <h3 className="text-base font-semibold text-earth-900">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm text-earth-600">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Pagination simple compatible mobile. */
export function Pagination({
  page,
  pageCount,
  basePath,
  searchParams,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams ?? {})) {
      if (v) params.set(k, v);
    }
    if (p > 1) params.set("page", String(p));
    else params.delete("page");
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn-secondary btn-md" aria-label="Page précédente">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : null}
      {Array.from({ length: pageCount }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 2)
        .map((p, idx, arr) => (
          <React.Fragment key={p}>
            {idx > 0 && arr[idx - 1]! < p - 1 ? <span className="px-1 text-earth-400">…</span> : null}
            <Link
              href={href(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "btn-md min-w-10 rounded-xl text-sm font-semibold",
                p === page ? "bg-brand-600 text-white" : "border border-earth-300 bg-white text-earth-700 hover:bg-earth-50",
              )}
            >
              {p}
            </Link>
          </React.Fragment>
        ))}
      {page < pageCount ? (
        <Link href={href(page + 1)} className="btn-secondary btn-md" aria-label="Page suivante">
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </nav>
  );
}
