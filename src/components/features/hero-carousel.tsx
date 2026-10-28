"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn, formatFCFA } from "@/lib/utils";

export type HeroSlide = {
  id: string;
  title: string;
  text: string;
  href: string;
  cta: string;
  tone: "indigo" | "sun" | "forest" | "kola";
  products: { slug: string; name: string; image: string; price: number; producer: string }[];
};

const INTERVAL_MS = 7000;

const TONES: Record<HeroSlide["tone"], { bg: string; button: string; muted: string }> = {
  indigo: { bg: "bg-brand-950 text-white", button: "btn-accent", muted: "opacity-75" },
  sun: { bg: "bg-sun-400 text-brand-950", button: "btn bg-brand-950 text-white hover:bg-brand-800", muted: "opacity-80" },
  forest: { bg: "bg-forest-800 text-white", button: "btn-accent", muted: "opacity-80" },
  kola: { bg: "bg-kola-700 text-white", button: "btn bg-white text-kola-700 hover:bg-kola-50", muted: "opacity-85" },
};

/**
 * Carrousel d'accueil.
 * - changement automatique toutes les 7 s, mis en pause au survol, au focus, quand l'onglet est caché
 *   et désactivé si l'utilisateur préfère un mouvement réduit ;
 * - bouton Pause / Lecture, flèches, points de navigation, balayage tactile ;
 * - les diapositives inactives sont `inert` (ni focus clavier, ni lecteur d'écran).
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [cycle, setCycle] = useState(0);
  const startX = useRef<number | null>(null);

  const count = slides.length;
  const paused = userPaused || hovered || focused || reduced || hidden;

  const go = useCallback(
    (next: number) => {
      setIndex(((next % count) + count) % count);
      setCycle((c) => c + 1);
    },
    [count],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mq.removeEventListener("change", onChange);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Relance la barre de progression et le minuteur à chaque reprise.
  useEffect(() => {
    if (!paused) setCycle((c) => c + 1);
  }, [paused]);

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = window.setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [paused, index, cycle, count, go]);

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
  }
  function onPointerUp(e: React.PointerEvent) {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
  }

  const active = slides[index];

  return (
    <section
      aria-roledescription="carrousel"
      aria-label="Sélection du moment"
      className="relative overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
    >
      <div
        className="flex touch-pan-y transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.2,1)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (startX.current = null)}
      >
        {slides.map((slide, i) => {
          const tone = TONES[slide.tone];
          const isActive = i === index;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="diapositive"
              aria-label={`${i + 1} sur ${count} : ${slide.title}`}
              inert={!isActive}
              data-active={isActive}
              className={cn("group relative w-full shrink-0", tone.bg)}
            >
              <div className="container-page grid min-h-[34rem] items-center gap-8 pb-24 pt-12 lg:min-h-[36rem] lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:pb-20">
                <div>
                  <h2
                    className="text-balance text-[3.25rem] font-extrabold leading-[0.95] tracking-tight group-data-[active=true]:animate-rise sm:text-7xl lg:text-8xl"
                    style={{ animationDelay: "60ms" }}
                  >
                    {slide.title}
                  </h2>
                  <p
                    className={cn("mt-6 max-w-md text-lg leading-relaxed group-data-[active=true]:animate-rise", tone.muted)}
                    style={{ animationDelay: "180ms" }}
                  >
                    {slide.text}
                  </p>
                  <div className="mt-8 group-data-[active=true]:animate-rise" style={{ animationDelay: "300ms" }}>
                    <Link href={slide.href} className={cn("btn btn-lg", tone.button)}>
                      {slide.cta}
                    </Link>
                  </div>
                </div>

                <ul className="grid grid-cols-3 items-start gap-3 sm:gap-4" aria-label={`Produits : ${slide.title}`}>
                  {slide.products.slice(0, 3).map((p, k) => (
                    <li
                      key={p.slug}
                      className={cn(
                        "group-data-[active=true]:animate-rise",
                        k === 1 ? "mt-8 sm:mt-12" : k === 2 ? "mt-3 sm:mt-5" : "",
                      )}
                      style={{ animationDelay: `${380 + k * 110}ms` }}
                    >
                      <Link
                        href={`/produits/${p.slug}`}
                        className="block overflow-hidden rounded-2xl bg-white text-earth-900 shadow-card transition hover:-translate-y-1"
                      >
                        <span className="relative block aspect-[4/5] bg-earth-100">
                          <Image
                            src={p.image}
                            alt=""
                            fill
                            priority={i === 0}
                            sizes="(max-width: 640px) 30vw, (max-width: 1024px) 22vw, 16vw"
                            className="object-cover"
                          />
                        </span>
                        <span className="block p-2.5 sm:p-3">
                          <span className="line-clamp-2 block text-xs font-semibold leading-snug sm:text-sm">{p.name}</span>
                          <span className="mt-1 block text-xs font-bold text-brand-700 sm:text-sm">{formatFCFA(p.price)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Commandes : points avec progression, flèches, pause */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0",
          active?.tone === "sun" ? "text-brand-950" : "text-white",
        )}
      >
        <div className="container-page flex items-center justify-between gap-4 pb-6">
          <div className="pointer-events-auto flex items-center gap-2" role="tablist" aria-label="Choisir une diapositive">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Diapositive ${i + 1} : ${s.title}`}
                onClick={() => go(i)}
                className="group/dot relative flex h-6 items-center"
              >
                <span
                  className={cn(
                    "bg-soft relative block h-1.5 overflow-hidden rounded-full transition-all duration-500",
                    i === index ? "w-14" : "w-6",
                  )}
                >
                  {i === index ? (
                    <span
                      key={cycle}
                      className="absolute inset-0 origin-left rounded-full bg-current"
                      style={{
                        animation: paused ? undefined : `progress ${INTERVAL_MS}ms linear forwards`,
                        transform: paused ? "scaleX(1)" : undefined,
                      }}
                    />
                  ) : null}
                </span>
              </button>
            ))}
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUserPaused((v) => !v)}
              className="border-soft hover-soft rounded-full border px-4 py-2 text-xs font-semibold transition"
              aria-pressed={userPaused}
            >
              {userPaused ? "Reprendre" : "Pause"}
            </button>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Diapositive précédente"
              className="border-soft hover-soft flex h-10 w-10 items-center justify-center rounded-full border transition"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Diapositive suivante"
              className="border-soft hover-soft flex h-10 w-10 items-center justify-center rounded-full border transition"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Annonce vocale du changement de diapositive */}
      <p className="sr-only" aria-live={paused ? "polite" : "off"}>
        {active ? `Diapositive ${index + 1} sur ${count} : ${active.title}` : ""}
      </p>
    </section>
  );
}
