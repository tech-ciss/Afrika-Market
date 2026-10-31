/**
 * Rattache les vraies photos de public/images aux produits, catégories et producteurs en base,
 * SANS réinitialiser les données (commandes, comptes et avis sont conservés).
 *
 *   npm run images:link            met à jour la base pointée par DATABASE_URL
 *   npm run images:link -- --dry   affiche ce qui changerait, sans rien écrire
 *
 * Pour la base de production : lance la commande avec le DATABASE_URL de production.
 */
import { PrismaClient } from "@prisma/client";
import { findLocalPhotos } from "../prisma/image-files";

const prisma = new PrismaClient();
const dry = process.argv.includes("--dry");

async function main() {
  let updated = 0;
  const missing: string[] = [];

  const products = await prisma.product.findMany({ select: { id: true, slug: true, name: true, images: true } });
  for (const p of products) {
    const photos = findLocalPhotos("products", p.slug);
    if (photos.length === 0) {
      missing.push(`produit   ${p.slug}`);
      continue;
    }
    if (JSON.stringify(photos) !== p.images) {
      if (!dry) await prisma.product.update({ where: { id: p.id }, data: { images: JSON.stringify(photos) } });
      updated++;
    }
  }

  const categories = await prisma.category.findMany({ select: { id: true, slug: true, imageUrl: true } });
  for (const c of categories) {
    const [photo] = findLocalPhotos("categories", c.slug);
    if (!photo) {
      missing.push(`catégorie ${c.slug}`);
      continue;
    }
    if (photo !== c.imageUrl) {
      if (!dry) await prisma.category.update({ where: { id: c.id }, data: { imageUrl: photo } });
      updated++;
    }
  }

  const producers = await prisma.producer.findMany({ select: { id: true, slug: true, logoUrl: true, coverUrl: true } });
  for (const pr of producers) {
    const [logo] = findLocalPhotos("producers", pr.slug);
    const [cover] = findLocalPhotos("producers", `${pr.slug}--cover`);
    if (!logo) missing.push(`producteur ${pr.slug}`);
    const data: { logoUrl?: string; coverUrl?: string } = {};
    if (logo && logo !== pr.logoUrl) data.logoUrl = logo;
    if (cover && cover !== pr.coverUrl) data.coverUrl = cover;
    if (Object.keys(data).length > 0) {
      if (!dry) await prisma.producer.update({ where: { id: pr.id }, data });
      updated++;
    }
  }

  console.log(`${dry ? "[simulation] " : ""}${updated} élément(s) mis à jour.`);
  if (missing.length > 0) {
    console.log(`\n${missing.length} sans photo (le visuel de substitution reste affiché) :`);
    for (const m of missing.slice(0, 40)) console.log(`  - ${m}`);
    if (missing.length > 40) console.log(`  … et ${missing.length - 40} autres (voir docs/IMAGES.md)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
