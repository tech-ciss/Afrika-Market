/** Visuel de substitution affiché si un produit n'a pas (encore) de photo, ou si elle ne charge pas. */
export const PLACEHOLDER_IMAGE = "/images/products/placeholder.svg";

/** Les images d'un produit sont stockées en JSON dans `Product.images`. */
export function parseImages(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string" && x.length > 0) : [];
  } catch {
    return [];
  }
}

export function coverImage(raw: string | null | undefined): string {
  return parseImages(raw)[0] ?? PLACEHOLDER_IMAGE;
}
