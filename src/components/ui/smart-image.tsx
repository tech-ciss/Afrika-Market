"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { PLACEHOLDER_IMAGE } from "@/lib/images";

/**
 * Image du site (next/image) avec deux comportements :
 *  - apparition en fondu quand elle finit de charger (pas de saut brutal sur connexion lente) ;
 *  - repli automatique sur le visuel de substitution si la photo est introuvable.
 *
 * Rendu serveur : l'image est visible telle quelle (aucune dépendance à JavaScript).
 * Le fondu ne s'applique qu'aux images encore en cours de chargement à l'hydratation.
 */
export function SmartImage({
  src,
  alt,
  className,
  fallback = PLACEHOLDER_IMAGE,
  onLoad,
  onError,
  ...props
}: Omit<ImageProps, "src"> & { src: string; fallback?: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [current, setCurrent] = useState(src);
  const [phase, setPhase] = useState<"idle" | "pending" | "loaded">("idle");

  useEffect(() => {
    setCurrent(src);
  }, [src]);

  useEffect(() => {
    const el = ref.current;
    if (el && !el.complete) setPhase("pending");
  }, [current]);

  return (
    <Image
      {...props}
      ref={ref}
      src={current}
      alt={alt}
      className={cn(className, phase === "pending" && "opacity-0", phase === "loaded" && "animate-img-in")}
      onLoad={(e) => {
        setPhase((p) => (p === "pending" ? "loaded" : p));
        onLoad?.(e);
      }}
      onError={(e) => {
        if (current !== fallback) {
          setPhase("pending");
          setCurrent(fallback);
        }
        onError?.(e);
      }}
    />
  );
}
