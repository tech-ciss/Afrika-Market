/**
 * Détection des vraies photos déposées dans /public/images.
 *
 * Convention de nommage (slug = identifiant dans l'URL du produit, de la catégorie, du producteur) :
 *
 *   public/images/products/<slug>.webp          photo principale
 *   public/images/products/<slug>--2.webp       photos supplémentaires (galerie), --3, --4…
 *   public/images/categories/<slug>.webp
 *   public/images/producers/<slug>.webp         logo / portrait
 *   public/images/producers/<slug>--cover.webp  bandeau de la page producteur
 *
 * Formats reconnus : webp, avif, jpg, jpeg, png. S'il n'y a pas de photo, le seed
 * retombe sur un visuel SVG de substitution (« Photo à venir »).
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export type ImageKind = "products" | "categories" | "producers";

export const PHOTO_EXTENSIONS = ["webp", "avif", "jpg", "jpeg", "png"] as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Retourne les URL publiques des photos d'un élément : principale d'abord, puis --2, --3… */
export function findLocalPhotos(kind: ImageKind, stem: string, root: string = process.cwd()): string[] {
  const dir = join(root, "public", "images", kind);
  if (!existsSync(dir)) return [];

  const ext = PHOTO_EXTENSIONS.join("|");
  const main = new RegExp(`^${escapeRegExp(stem)}\\.(${ext})$`, "i");
  const extra = new RegExp(`^${escapeRegExp(stem)}--(\\d+)\\.(${ext})$`, "i");

  const files = readdirSync(dir);
  const first = files.find((f) => main.test(f));
  const more = files
    .map((f) => ({ f, m: extra.exec(f) }))
    .filter((x): x is { f: string; m: RegExpExecArray } => x.m !== null)
    .sort((a, b) => Number(a.m[1]) - Number(b.m[1]))
    .map((x) => x.f);

  return [...(first ? [first] : []), ...more].map((f) => `/images/${kind}/${f}`);
}
