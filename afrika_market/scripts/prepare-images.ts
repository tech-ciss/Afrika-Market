/**
 * Prépare tes photos pour le web : recadrage intelligent, redimensionnement, conversion WebP.
 *
 *   1. Dépose tes photos d'origine (peu importe leur poids) dans :
 *        photos-source/products/<slug>.jpg
 *        photos-source/categories/<slug>.jpg
 *        photos-source/producers/<slug>.jpg      et  <slug>--cover.jpg
 *      (suffixe --2, --3… pour les photos supplémentaires d'un produit)
 *   2. npm run images:prepare     → écrit les .webp optimisés dans public/images/…
 *   3. npm run images:link        → rattache les photos aux produits en base
 *
 * Les noms de fichiers attendus sont listés dans docs/IMAGES.md.
 */
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";
import sharp from "sharp";

const SOURCE = join(process.cwd(), "photos-source");
const TARGET = join(process.cwd(), "public", "images");
const INPUT_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff"]);

interface Spec {
  width: number;
  height: number;
  quality: number;
}

/** Format de sortie selon le type de photo. */
function specFor(kind: string, name: string): Spec {
  if (kind === "producers" && name.endsWith("--cover")) return { width: 1800, height: 900, quality: 78 };
  if (kind === "producers") return { width: 640, height: 640, quality: 82 };
  if (kind === "categories") return { width: 1200, height: 1500, quality: 78 };
  return { width: 1400, height: 1400, quality: 80 };
}

async function main() {
  if (!existsSync(SOURCE)) {
    console.log(`Dossier introuvable : ${SOURCE}\nCrée photos-source/products, photos-source/categories et photos-source/producers.`);
    return;
  }

  let done = 0;
  let before = 0;
  let after = 0;

  for (const kind of ["products", "categories", "producers"]) {
    const dir = join(SOURCE, kind);
    if (!existsSync(dir)) continue;
    const out = join(TARGET, kind);
    mkdirSync(out, { recursive: true });

    for (const file of readdirSync(dir)) {
      const ext = extname(file).toLowerCase();
      if (!INPUT_EXT.has(ext)) continue;
      const name = basename(file, extname(file));
      const spec = specFor(kind, name);
      const input = join(dir, file);
      const output = join(out, `${name}.webp`);

      await sharp(input)
        .rotate() // respecte l'orientation EXIF des photos de téléphone
        .resize({ width: spec.width, height: spec.height, fit: "cover", position: sharp.strategy.attention })
        .webp({ quality: spec.quality })
        .toFile(output);

      before += statSync(input).size;
      after += statSync(output).size;
      done++;
      console.log(`✓ ${kind}/${name}.webp`);
    }
  }

  const mb = (n: number) => (n / 1024 / 1024).toFixed(1);
  console.log(`\n${done} photo(s) préparée(s) : ${mb(before)} Mo → ${mb(after)} Mo.`);
  if (done > 0) console.log("Étape suivante : npm run images:link");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
