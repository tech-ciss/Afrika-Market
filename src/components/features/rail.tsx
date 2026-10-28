"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Section à défilement horizontal (carrousel « rail ») :
 * - défilement tactile natif avec accroche (scroll-snap) ;
 * - flèches précédent / suivant pour la souris et le clavier ;
 * - aucune bibliothèque, aucune animation automatique.
 */
export function Rail({
  title,
  subtitle,
  href,
  linkLabel = "Tout voir",
  tone = "light",
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  tone?: "light" | "dark";
  children: React.ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  function scrollByPage(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  const dark = tone === "dark";
  const arrow = cn(
    "flex h-10 w-10 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-30",
    dark
      ? "border-white/30 text-white hover:bg-white/10"
      : "border-earth-300 text-earth-800 hover:border-earth-800 hover:bg-white",
  );

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className={cn("text-2xl font-bold sm:text-3xl", dark ? "text-white" : "text-earth-900")}>{title}</h2>
          {subtitle ? (
            <p className={cn("mt-1.5 max-w-xl text-sm", dark ? "text-white/70" : "text-earth-600")}>{subtitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {href ? (
            <Link
              href={href}
              className={cn(
                "text-sm font-semibold underline-offset-4 hover:underline",
                dark ? "text-white" : "text-brand-700",
              )}
            >
              {linkLabel}
            </Link>
          ) : null}
          <div className="hidden gap-2 sm:flex">
            <button type="button" className={arrow} onClick={() => scrollByPage(-1)} disabled={atStart} aria-label={`${title} : précédent`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" className={arrow} onClick={() => scrollByPage(1)} disabled={atEnd} aria-label={`${title} : suivant`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={update}
        role="region"
        aria-label={title}
        tabIndex={0}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
      >
        {children}
      </div>
    </div>
  );
}

/** Élément d'un rail : largeur adaptée au mobile (on voit toujours le début de la carte suivante). */
export function RailItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("w-[62%] shrink-0 snap-start sm:w-[34%] lg:w-[calc(25%-0.75rem)]", className)}>{children}</div>
  );
}
