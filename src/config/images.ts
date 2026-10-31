/**
 * Hébergeurs d'images autorisés : source unique pour
 *  - next.config.ts (remotePatterns de next/image) ;
 *  - la validation Zod des URL saisies par les vendeurs et l'administration.
 * Une URL hors liste ne s'afficherait pas (l'optimiseur d'images refuse les hôtes inconnus) :
 * on la refuse donc dès la saisie, avec un message clair.
 */
export const IMAGE_HOSTS = ["res.cloudinary.com", "utfs.io", "images.unsplash.com", "images.pexels.com"] as const;

/** Suffixes de domaine autorisés (Vercel Blob : <store>.public.blob.vercel-storage.com). */
export const IMAGE_HOST_SUFFIXES = [".public.blob.vercel-storage.com"] as const;

/** Chemin local (« /images/… ») ou URL https d'un hébergeur autorisé. */
export function isAllowedImageUrl(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return (
      (IMAGE_HOSTS as readonly string[]).includes(url.hostname) ||
      IMAGE_HOST_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix))
    );
  } catch {
    return false;
  }
}

export const IMAGE_URL_ERROR =
  "Image non autorisée : utilisez un lien Cloudinary, UploadThing, Vercel Blob, Unsplash ou Pexels (https).";
