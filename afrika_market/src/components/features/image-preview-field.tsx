"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Champ « lien d'image » avec aperçu immédiat.
 * L'aperçu utilise une balise <img> simple (et non next/image) : l'URL est en cours de saisie, donc
 * pas encore forcément autorisée par l'optimiseur d'images. La validation définitive reste côté serveur.
 */
export function ImagePreviewField({
  id,
  name,
  label,
  hint,
  defaultValue = "",
  error,
  shape = "square",
}: {
  id: string;
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string;
  error?: string;
  shape?: "square" | "wide";
}) {
  const [value, setValue] = useState(defaultValue);
  const [failed, setFailed] = useState(false);
  const url = value.trim();
  const showable = url !== "" && !failed;

  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-earth-300 bg-earth-50 text-earth-500",
            shape === "square" ? "h-20 w-20" : "h-20 w-32",
          )}
          aria-hidden
        >
          {showable ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => setFailed(true)} />
          ) : (
            <ImageOff className="h-6 w-6" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input
            id={id}
            name={name}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setFailed(false);
            }}
            placeholder="https://res.cloudinary.com/…"
            className="field"
            inputMode="url"
            aria-invalid={error ? true : undefined}
            aria-describedby={`${id}-hint`}
          />
          <p id={`${id}-hint`} className={cn("mt-1.5 text-xs", error ? "font-medium text-kola-600" : "text-earth-500")}>
            {error ?? (failed ? "Cette image ne se charge pas : vérifiez le lien." : hint)}
          </p>
        </div>
      </div>
    </div>
  );
}
