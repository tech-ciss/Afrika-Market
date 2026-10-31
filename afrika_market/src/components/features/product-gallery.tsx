"use client";

import { useState } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { PLACEHOLDER_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";

/**
 * Galerie de la fiche produit : photo principale + vignettes cliquables,
 * et zoom qui suit la souris sur ordinateur (jamais au toucher, pour ne pas gêner le défilement).
 */
export function ProductGallery({
  images,
  name,
  badge,
}: {
  images: string[];
  name: string;
  badge?: React.ReactNode;
}) {
  const list = images.length > 0 ? images : [PLACEHOLDER_IMAGE];
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const current = list[Math.min(index, list.length - 1)]!;

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  }

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl border border-earth-200 bg-white"
        onPointerMove={onPointerMove}
        onPointerLeave={() => setZoom(null)}
      >
        <SmartImage
          key={current}
          src={current}
          alt={name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-transform duration-200 ease-out"
          style={zoom ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
        {badge}
      </div>

      {list.length > 1 ? (
        <ul className="grid grid-cols-5 gap-3" aria-label="Photos du produit">
          {list.slice(0, 5).map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Voir la photo ${i + 1} sur ${list.length}`}
                aria-current={i === index}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-xl border bg-white transition",
                  i === index ? "border-brand-700 ring-2 ring-brand-700/30" : "border-earth-200 opacity-80 hover:opacity-100",
                )}
              >
                <SmartImage src={src} alt="" fill sizes="120px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
