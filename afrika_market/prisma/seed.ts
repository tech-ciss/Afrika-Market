/**
 * Seed AFRIKA MARKET — environnement de démonstration réaliste (§29).
 *
 *   npx prisma db reset --force   puis   npm run db:seed
 *
 * Comptes de test (documentés dans le README) :
 *   superadmin@afrikamarket.ci / Afrika2026!
 *   admin@afrikamarket.ci      / Afrika2026!
 *   vendeur@afrikamarket.ci    / Afrika2026!
 *   client@afrikamarket.ci     / Afrika2026!
 */
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { findLocalPhotos, type ImageKind } from "./image-files";

const prisma = new PrismaClient();
const PASSWORD = hashSync("Afrika2026!", 10);

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const daysAgo = (n: number, h = 10) => {
  const d = new Date(Date.now() - n * 86_400_000);
  d.setHours(h, Math.floor(Math.random() * 59), 0, 0);
  return d;
};

const pick = <T,>(arr: T[], i: number) => arr[i % arr.length]!;

const IMAGES_DIR = join(process.cwd(), "public", "images", "products");

/** Couleurs des visuels de substitution (fond clair, fond sombre), alignées sur l'identité du site. */
const CATEGORY_COLORS: Record<string, [string, string]> = {
  alimentation: ["#b57a06", "#4a3003"],
  boissons: ["#c8372d", "#4d100c"],
  "epices-condiments": ["#a92a22", "#3d0d0a"],
  "fruits-noix": ["#dfa10b", "#5a3f04"],
  "cacao-chocolat": ["#6b4331", "#24120b"],
  "cafe-the": ["#4c3328", "#150c08"],
  "miel-confitures": ["#f7bc1c", "#7a5504"],
  "cereales-legumineuses": ["#a09d90", "#3b392f"],
  "cosmetique-naturelle": ["#5da075", "#163024"],
  "artisanat-decoration": ["#4358b9", "#121a42"],
  "coffrets-cadeaux": ["#33449b", "#0e1536"],
  coco: ["#8dbf9d", "#1f4733"],
};

/**
 * Visuel de substitution tant qu'aucune vraie photo n'est fournie : une arche et la mention
 * « Photo à venir » (pour repérer d'un coup d'œil ce qu'il reste à photographier).
 * Le nom du produit n'est que dans l'aria-label : il est déjà affiché à côté de l'image.
 */
function writeProductImage(file: string, name: string, categorySlug: string) {
  const [light, dark] = CATEGORY_COLORS[categorySlug] ?? ["#33449b", "#0e1536"];
  const label = name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").slice(0, 28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="${label}">
  <rect width="800" height="800" fill="${dark}"/>
  <path d="M170 640 V360 a230 230 0 0 1 460 0 V640 Z" fill="${light}"/>
  <path d="M215 640 V365 a185 185 0 0 1 370 0 V640 Z" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="3"/>
  <circle cx="400" cy="330" r="62" fill="#ffffff" fill-opacity="0.18"/>
  <text x="400" y="560" font-size="30" text-anchor="middle" fill="#ffffff" fill-opacity="0.8" font-family="system-ui, sans-serif">Photo à venir</text>
</svg>`;
  writeFileSync(join(IMAGES_DIR, file), svg);
  return `/images/products/${file}`;
}

/** Vraies photos si elles existent (voir prisma/image-files.ts), sinon visuel de substitution. */
function resolveImages(kind: ImageKind, stem: string, fallbackFile: string, name: string, categorySlug: string): string[] {
  const photos = findLocalPhotos(kind, stem);
  return photos.length > 0 ? photos : [writeProductImage(fallbackFile, name, categorySlug)];
}

// ---------------------------------------------------------------------------
// Données de référence
// ---------------------------------------------------------------------------

const COUNTRIES = [
  { name: "Côte d'Ivoire", code: "CI", position: 1 },
  { name: "Sénégal", code: "SN", position: 2 },
  { name: "Bénin", code: "BJ", position: 3 },
  { name: "Togo", code: "TG", position: 4 },
  { name: "Burkina Faso", code: "BF", position: 5 },
  { name: "Mali", code: "ML", position: 6 },
  { name: "Guinée", code: "GN", position: 7 },
];

const CATEGORIES: { name: string; desc: string; children?: string[] }[] = [
  { name: "Alimentation", desc: "Produits alimentaires artisanaux et locaux d'Afrique de l'Ouest." },
  { name: "Boissons", desc: "Jus, infusions et boissons traditionnelles." , children: ["Jus & nectars"] },
  { name: "Épices & condiments", desc: "Épices, piments et assaisonnements de nos régions." },
  { name: "Fruits & noix", desc: "Fruits séchés, fruits à coque et produits de la forêt." },
  { name: "Cacao & chocolat", desc: "Cacao traçable et chocolat transformé localement." , children: ["Chocolat"] },
  { name: "Café & thé", desc: "Café arabica d'Afrique de l'Ouest et thés locaux." },
  { name: "Miel & confitures", desc: "Miels de terroir, confitures et pâtes à tartiner." },
  { name: "Céréales & légumineuses", desc: "Riz, maïs, niébé et céréales locales." },
  { name: "Cosmétique naturelle", desc: "Soins artisanaux à base de karité, coco et plantes.", children: ["Savons"] },
  { name: "Artisanat & décoration", desc: "Vannerie, textile, bois et objets d'art." },
  { name: "Coffrets cadeaux", desc: "Sélection de produits locaux prêts à offrir." },
  { name: "Coco", desc: "Huile, lait, farine et sucre de coco — produits à base de coco." },
];

type Seed = {
  producer: number;
  category: string;
  name: string;
  price: number;
  unit: string;
  desc: string;
  region: string;
  city: string;
  tags: string;
  stock: number;
  compareAt?: number;
  featured?: boolean;
  isNew?: boolean;
  method?: string;
  harvest?: string;
};

const PRODUCERS = [
  {
    name: "Coopérative Cacao de Soubré",
    region: "Sud-Ouest",
    city: "Soubré",
    desc: "Coopérative de 340 producteurs de cacao certifiés, engagée dans une filière tracée du champ à la tablette.",
    story:
      "Fondée en 2009, la Coopérative Cacao de Soubré regroupe des familles de planteurs du Sud-Ouest ivoirien. Chaque parcelle est géolocalisée, chaque lot de fèves est suivi jusqu'au poste de collecte.",
    tags: "cacao, chocolat, filière tracée",
    certs: "Rainforest Alliance, Commerce équitable",
  },
  {
    name: "Maison du Karité",
    region: "Savanes",
    city: "Korhogo",
    desc: "Transformation artisanale du beurre de karité par une coopérative de femmes à Korhogo.",
    story:
      "Dans les villages autour de Korhogo, les femmes transmettent depuis trois générations le savoir-faire du karité : collecte des amandes, séchage, torréfaction, pressage à froid.",
    tags: "karité, cosmétique, coopérative de femmes",
    certs: "Bio équivalent, Commerce équitable",
  },
  {
    name: "Saveurs de Korhogo",
    region: "Savanes",
    city: "Korhogo",
    desc: "Épices, piments séchés et noix de cajou premium des Savanes ivoiriennes.",
    story: "Séchage solaire sur claies, tri manuel, conditionnement dans l'atelier familial de Korhogo.",
    tags: "épices, cajou, piment",
    certs: "",
  },
  {
    name: "Terroirs de Soubré",
    region: "Sud-Ouest",
    city: "Soubré",
    desc: "Fruits tropicaux, plantain, huile de palme rouge et cacao du Sud-Ouest.",
    story: "Exploitation familiale de 62 hectares, en agroforesterie depuis 2015.",
    tags: "fruits, huile de palme, plantain",
    certs: "",
  },
  {
    name: "Artisans d'Abidjan",
    region: "Lagunes",
    city: "Abidjan",
    desc: "Atelier de vannerie et de textile réunissant dix artisans de Cocody et Bingerville.",
    story:
      "L'atelier travaille le raphia, le coton teint à l'indigo et le bois d'Iroko, avec des motifs inspirés des tissus bogolan et kente.",
    tags: "vannerie, textile, décoration",
    certs: "Entreprise du secteur formel",
  },
  {
    name: "Café de Man",
    region: "Tonkpi",
    city: "Man",
    desc: "Café arabica de montagne cultivé sur les pentes du mont Tonkoui.",
    story: "Torréfaction artisanale par petits lots, lavage naturel à la source.",
    tags: "café, arabica, torréfaction",
    certs: "",
  },
  {
    name: "Mia Faso Céréales",
    region: "Centre",
    city: "Katiola",
    desc: "Riz de plaine, niébé et arachides de la région du Centre.",
    story: "Unité de tri et d'ensachage alimentée à l'énergie solaire.",
    tags: "riz, niébé, arachide, céréales",
    certs: "",
  },
  {
    name: "Cocotiers d'Assinie",
    region: "Sud-Comoé",
    city: "Assinie",
    desc: "Huile de coco vierge, lait de coco et sucre de coco du littoral ivoirien.",
    story: "Récolte de noix de coco sur les plantations familiales du bord de mer, séchage lent et pressage à froid.",
    tags: "coco, huile, lait de coco",
    certs: "",
  },
  {
    name: "Miellerie du Bandama",
    region: "Gôh",
    city: "Gagnoa",
    desc: "Miel de fleurs et miel de forêt récoltés le long du fleuve Bandama.",
    story: "42 ruches kényanes suivies par un apiculteur formé au fil des saisons sèches.",
    tags: "miel, apiculture, forêt",
    certs: "",
  },
];

const PRODUCTS: Seed[] = [
  // --- Coopérative Cacao de Soubré ---
  { producer: 0, category: "cacao-chocolat", name: "Fèves de cacao torréfiées 500 g", price: 4500, unit: "sachet", desc: "Fèves de cacao criollo torréfiées, idéales pâtissière ou à grignoter. Découvertes notes de banane et de fruits rouges.", region: "Sud-Ouest", city: "Soubré", tags: "cacao, fèves, torréfié", stock: 42, method: "Torréfaction artisanale, séchage solaire", harvest: "Octobre – Mars" },
  { producer: 0, category: "cacao-chocolat", name: "Chocolat noir 70 % - tablette 100 g", price: 3200, unit: "tablette", desc: "Tablette artisanale conchée à partir de fèves de la coopérative, sans lécithine ni arôme ajouté.", region: "Sud-Ouest", city: "Soubré", tags: "chocolat, noir, tablette", stock: 60, compareAt: 3900, featured: true, method: "Transformation locale, conchage 48 h" },
  { producer: 0, category: "cacao-chocolat", name: "Chocolat au lait & noix de cajou", price: 3800, unit: "tablette", desc: "Tablette au lait parsemée de morceaux de cajou des Savanes.", region: "Sud-Ouest", city: "Soubré", tags: "chocolat, lait, cajou", stock: 28, method: "Transformation locale" },
  { producer: 0, category: "cacao-chocolat", name: "Poudre de cacao pure 250 g", price: 3600, unit: "sachet", desc: "Cacao en poudre dégraissé à froid, intense et sans sucre.", region: "Sud-Quest", city: "Soubré", tags: "cacao, poudre, pâtisserie", stock: 0, method: "Broyage à froid" },
  { producer: 0, category: "coffrets-cadeaux", name: "Coffret Découverte Cacao", price: 12500, unit: "coffret", desc: "Tablette 70 %, fèves torréfiées et poudre de cacao dans un coffret en raphia.", region: "Sud-Ouest", city: "Soubré", tags: "coffret, cadeau, cacao", stock: 15, featured: true, method: "Assemblage manuel" },

  // --- Maison du Karité ---
  { producer: 1, category: "cosmetique-naturelle", name: "Beurre de karité pur 100 % - 200 g", price: 3500, unit: "pot", desc: "Beurre de karité non raffiné, pressé à froid à Korhogo. Peaux sèches, cheveux, massage.", region: "Savanes", city: "Korhogo", tags: "karité, soin, pur", stock: 74, featured: true, method: "Pressage à froid, filtration artisanale", isNew: false },
  { producer: 1, category: "cosmetique-naturelle", name: "Beurre de karité & cocoa butter", price: 4200, unit: "pot", desc: "Mélange de karité et de beurre de cacao pour une nutrition intense.", region: "Savanes", city: "Korhogo", tags: "karité, cocoa, soin", stock: 35, method: "Pressage à froid" },
  { producer: 1, category: "cosmetique-naturelle", name: "Savon noir africain traditionnel", price: 1500, unit: "pain", desc: "Savon noir à base de cendres de cabosse et de beurre de karité, nettoyage doux.", region: "Savanes", city: "Korhogo", tags: "savon, noir, traditionnel", stock: 120, compareAt: 1900, method: "Saponification à froid" },
  { producer: 1, category: "cosmetique-naturelle", name: "Savon karité & huile de coco", price: 2200, unit: "pain", desc: "Savon surgras au karité et coco, parfum doux de vanille.", region: "Savanes", city: "Korhogo", tags: "savon, karité, coco", stock: 4, method: "Saponification à froid" },
  { producer: 1, category: "cosmetique-naturelle", name: "Huile de karité pour cheveux 100 ml", price: 5500, unit: "flacon", desc: "Huile de karité liquéfiée, pénétration rapide, cheveux secs et crépus.", region: "Savanes", city: "Korhogo", tags: "huile, karité, cheveux", stock: 22, method: "Pressage à froid" },
  { producer: 1, category: "coffrets-cadeaux", name: "Coffret Rituel Karité", price: 14500, unit: "coffret", desc: "Beurre de karité, savon noir et huile cheveux dans un coffret en bois.", region: "Savanes", city: "Korhogo", tags: "coffret, karité, cadeau", stock: 9, compareAt: 17000, featured: true, method: "Assemblage manuel" },

  // --- Saveurs de Korhogo ---
  { producer: 2, category: "fruits-noix", name: "Noix de cajou premium 500 g", price: 5500, unit: "sachet", desc: "Cajou entier, séché au soleil et trié main. Découvertes crémeuses.", region: "Savanes", city: "Korhogo", tags: "cajou, noix, snacking", stock: 58, featured: true, method: "Séchage solaire sur claies", harvest: "Mars – Juin" },
  { producer: 2, category: "fruits-noix", name: "Cajou grillé au sel de mer", price: 6200, unit: "sachet", desc: "Cajou grillé à sec et relevé d'une pincée de sel de mer.", region: "Savanes", city: "Korhogo", tags: "cajou, grillé, snacking", stock: 33, compareAt: 6900 },
  { producer: 2, category: "epices-condiments", name: "Piment moulu de Korhogo 80 g", price: 1500, unit: "pot", desc: "Piment séché puis moulu, puissance régulière.", region: "Savanes", city: "Korhogo", tags: "piment, épice, fort", stock: 90, method: "Séchage solaire, broyage" },
  { producer: 2, category: "epices-condiments", name: "Poivre de Guinée (piment long)", price: 2800, unit: "sachet", desc: "Piment long aromatique, notes poivrées et boisées.", region: "Savanes", city: "Korhogo", tags: "poivre, épice, guinée", stock: 26, method: "Séchage solaire" },
  { producer: 2, category: "epices-condiments", name: "Mélange épices pour braisé 150 g", price: 2500, unit: "sachet", desc: "Assemblage de gingembre, piment, poivre et ail séché pour viandes braisées.", region: "Savanes", city: "Korhogo", tags: "braisé, épice, mélange", stock: 47, compareAt: 3000, method: "Assemblage et broyage" },
  { producer: 2, category: "fruits-noix", name: "Noix de cajou cassées 250 g", price: 2900, unit: "sachet", desc: "Morceaux de cajou pour pâtisserie et trempettes, prix doux.", region: "Savanes", city: "Korhogo", tags: "cajou, cassé, économique", stock: 0, method: "Séchage solaire" },

  // --- Terroirs de Soubré ---
  { producer: 3, category: "alimentation", name: "Huile de palme rouge 1 L", price: 4500, unit: "bouteille", desc: "Huile de palme rouge artisanale, couleur et goût authentiques.", region: "Sud-Ouest", city: "Soubré", tags: "huile, palme, cuisine", stock: 40, method: "Pressage artisanal" },
  { producer: 3, category: "alimentation", name: "Gari de manioc soyeux 1 kg", price: 1800, unit: "sachet", desc: "Gari fin, séché et torréfié selon la méthode du Sud-Ouest.", region: "Sud-Ouest", city: "Soubré", tags: "gari, manioc, attiéké", stock: 65, method: "Fermentation puis séchage" },
  { producer: 3, category: "fruits-noix", name: "Banane plantain séchée 500 g", price: 2200, unit: "sachet", desc: "Chips de plantain naturelles, sans friture industrielle.", region: "Sud-Ouest", city: "Soubré", tags: "plantain, snacking, séché", stock: 30, compareAt: 2600 },
  { producer: 3, category: "epices-condiments", name: "Sauce graine de courge 400 g", price: 2800, unit: "bocal", desc: "Pâte de graine de courge prête à assaisonner, façon lokon.", region: "Sud-Ouest", city: "Soubré", tags: "sauce, graine, courge", stock: 18, method: "Torréfaction et broyage" },
  { producer: 3, category: "fruits-noix", name: "Ananas séché de Soubré 150 g", price: 2500, unit: "sachet", desc: "Lamelles d'ananas séchées au soleil, sans sucre ajouté.", region: "Sud-Ouest", city: "Soubré", tags: "ananas, séché, fruit", stock: 12, isNew: true, method: "Séchage solaire" },

  // --- Artisans d'Abidjan ---
  { producer: 4, category: "artisanat-decoration", name: "Panier tressé en raphia moyen", price: 9500, unit: "pièce", desc: "Panier tressé main, doublé coton, anses renforcées. 32 cm de diamètre.", region: "Lagunes", city: "Abidjan", tags: "panier, raphia, vannerie", stock: 24, featured: true, method: "Tressage manuel au raphia" },
  { producer: 4, category: "artisanat-decoration", name: "Panier tressé grand format", price: 16500, unit: "pièce", desc: "Grand panier de marché, 45 cm, tressage serré.", region: "Lagunes", city: "Abidjan", tags: "panier, raphia, grand", stock: 11, method: "Tressage manuel" },
  { producer: 4, category: "artisanat-decoration", name: "Coussin bogolan - lot de 2", price: 12000, unit: "lot", desc: "Coussins en coton teint à l'indigo avec motifs bogolan.", region: "Lagunes", city: "Abidjan", tags: "coussin, bogolan, textile", stock: 16, compareAt: 14000, method: "Teinture végétale, couture main" },
  { producer: 4, category: "artisanat-decoration", name: "Couverture kente tissée 200×240 cm", price: 38500, unit: "pièce", desc: "Couverture tissée au métier à tisser, motifs géométriques.", region: "Lagunes", city: "Abidjan", tags: "couverture, kente, tissage", stock: 3, method: "Tissage au métier" },
  { producer: 4, category: "artisanat-decoration", name: "Bol en bois d'Iroko gravé", price: 6500, unit: "pièce", desc: "Bol tourné et gravé à la main, huile de cire d'abeille.", region: "Lagunes", city: "Abidjan", tags: "bol, bois, iroko", stock: 27, method: "Tournage et gravure" },
  { producer: 4, category: "coffrets-cadeaux", name: "Coffret Artisanat d'Abidjan", price: 24500, unit: "coffret", desc: "Bol gravé, coussin bogolan et mini-panier réunis dans un coffret.", region: "Lagunes", city: "Abidjan", tags: "coffret, artisanat, cadeau", stock: 7, method: "Assemblage manuel" },

  // --- Café de Man ---
  { producer: 5, category: "cafe-the", name: "Café arabica grains 500 g", price: 6500, unit: "sachet", desc: "Arabica de montagne du mont Tonkoui, notes de cacao et d'agrumes.", region: "Tonkpi", city: "Man", tags: "café, arabica, grains", stock: 38, featured: true, method: "Torréfaction par petits lots", harvest: "Novembre – Février" },
  { producer: 5, category: "cafe-the", name: "Café moulu filtre 250 g", price: 3800, unit: "sachet", desc: "Mouture filtre, torréfaction moyenne, emballage valve.", region: "Tonkpi", city: "Man", tags: "café, moulu, filtre", stock: 52, method: "Torréfaction et mouture" },
  { producer: 5, category: "cafe-the", name: "Café décaféiné à l'eau 250 g", price: 4500, unit: "sachet", desc: "Décaféination à l'eau, sans solvant.", region: "Tonkpi", city: "Man", tags: "café, décaféiné", stock: 0, method: "Décaféination à l'eau" },
  { producer: 5, category: "cafe-the", name: "Infusion bissap & gingembre 100 g", price: 2800, unit: "sachet", desc: "Hibiscus séché et gingembre, infusion fruitée et tonique.", region: "Tonkpi", city: "Man", tags: "bissap, infusion, gingembre", stock: 44, compareAt: 3300 },

  // --- Mia Faso Céréales ---
  { producer: 6, category: "cereales-legumineuses", name: "Riz parfumé de Katiola 5 kg", price: 6800, unit: "sac", desc: "Riz local parfumé, trié et poli dans notre unité de Katiola.", region: "Centre", city: "Katiola", tags: "riz, parfumé, local", stock: 80, featured: true, method: "Triage et polissage" },
  { producer: 6, category: "cereales-legumineuses", name: "Riz complet 1 kg", price: 1900, unit: "sachet", desc: "Riz complet non décortiqué, riche en fibres.", region: "Centre", city: "Katiola", tags: "riz, complet, sain", stock: 46 },
  { producer: 6, category: "cereales-legumineuses", name: "Niébé blanc 1 kg", price: 1500, unit: "sachet", desc: "Haricots niébé blancs, protéines végétales à prix doux.", region: "Centre", city: "Katiola", tags: "niébé, haricot, protéine", stock: 70 },
  { producer: 6, category: "cereales-legumineuses", name: "Arachides décortiquées 500 g", price: 2200, unit: "sachet", desc: "Arachides fraîches décortiquées, à griller ou en sauce.", region: "Centre", city: "Katiola", tags: "arachide, snacking", stock: 3, compareAt: 2600 },
  { producer: 6, category: "cereales-legumineuses", name: "Maïs soufflé local 400 g", price: 2000, unit: "sachet", desc: "Pop-corn de maïs local, à préparer en 3 minutes.", region: "Centre", city: "Katiola", tags: "maïs, soufflé, snacking", stock: 36, isNew: true },

  // --- Cocotiers d'Assinie ---
  { producer: 7, category: "coco", name: "Huile de coco vierge 500 ml", price: 4800, unit: "bouteille", desc: "Huile de coco extraite à froid, usage alimentaire et cosmétique.", region: "Sud-Comoé", city: "Assinie", tags: "coco, huile, vierge", stock: 41, method: "Pressage à froid" },
  { producer: 7, category: "coco", name: "Lait de coco 400 ml", price: 2600, unit: "brique", desc: "Lait de coco onctueux pour sauces et desserts.", region: "Sud-Comoé", city: "Assinie", tags: "coco, lait, cuisine", stock: 55, compareAt: 3000 },
  { producer: 7, category: "coco", name: "Sucre de coco 500 g", price: 3200, unit: "sachet", desc: "Sucre de fleur de coco, index glycémique plus bas.", region: "Sud-Comoé", city: "Assinie", tags: "sucre, coco, édulcorant", stock: 29 },
  { producer: 7, category: "boissons", name: "Coco fraîche pressée - pack de 6", price: 5400, unit: "pack", desc: "Six noix de coco fraîches pressées le matin même.", region: "Sud-Comoé", city: "Assinie", tags: "coco, boisson, frais", stock: 14, isNew: true },

  // --- Miellerie du Bandama ---
  { producer: 8, category: "miel-confitures", name: "Miel de fleurs 500 g", price: 4500, unit: "pot", desc: "Miel liquide doré de fleurs cultivées le long du Bandama.", region: "Gôh", city: "Gagnoa", tags: "miel, fleurs, doux", stock: 50, featured: true, method: "Extraction à froid, filtration", harvest: "Saison sèche" },
  { producer: 8, category: "miel-confitures", name: "Miel de forêt 500 g", price: 6200, unit: "pot", desc: "Miel sombre, notes boisées et caramélisées, récolte de forêt.", region: "Gôh", city: "Gagnoa", tags: "miel, forêt, intense", stock: 21, method: "Extraction à froid" },
  { producer: 8, category: "miel-confitures", name: "Confiture de mangue Kent 350 g", price: 2900, unit: "pot", desc: "Confiture de mangue Kent au sucre de canne, cuisson au chaudron.", region: "Gôh", city: "Gagnoa", tags: "confiture, mangue, fruits", stock: 34, compareAt: 3400 },
  { producer: 8, category: "miel-confitures", name: "Pâte à tartiner cacao & karité", price: 4200, unit: "pot", desc: "Pâte à tartiner au cacao et beurre de karité, sans huile de palme.", region: "Gôh", city: "Gagnoa", tags: "pâte, cacao, tartiner", stock: 2, method: "Cuisson artisanale" },

  // --- Alimentation & boissons complémentaires ---
  { producer: 3, category: "boissons", name: "Jus de gingembre pressé 1 L", price: 2500, unit: "bouteille", desc: "Jus de gingembre frais, piquant et tonique, sans conservateur.", region: "Sud-Ouest", city: "Soubré", tags: "jus, gingembre, frais", stock: 26, method: "Pressage à froid" },
  { producer: 8, category: "boissons", name: "Bissap naturel 1 L", price: 2200, unit: "bouteille", desc: "Infusion d'hibiscus frais, servie fraîche ou à préparer.", region: "Gôh", city: "Gagnoa", tags: "bissap, hibiscus, jus", stock: 31, compareAt: 2600 },
  { producer: 5, category: "boissons", name: "Thé vert & citron vert 100 g", price: 3400, unit: "sachet", desc: "Assemblage de thé vert et de citron vert séché.", region: "Tonkpi", city: "Man", tags: "thé, citron, infusion", stock: 19 },
  { producer: 2, category: "alimentation", name: "Beignets de haricot - farine 1 kg", price: 1900, unit: "sachet", desc: "Farine de haricot déjà assaisonnée pour beignets et acras.", region: "Savanes", city: "Korhogo", tags: "farine, haricot, beignet", stock: 58 },
  { producer: 6, category: "alimentation", name: "Attieké de manioc 1 kg", price: 1600, unit: "sachet", desc: "Attieké fin fermenté, accompagnement traditionnel des poissons.", region: "Centre", city: "Katiola", tags: "attiéké, manioc, accompagnement", stock: 4, isNew: true },
  { producer: 3, category: "epices-condiments", name: "Poudre d'ébène (haricot noir)", price: 2400, unit: "sachet", desc: "Farine de haricot noir torréfié, épice de sauce graine.", region: "Sud-Ouest", city: "Soubré", tags: "épice, haricot noir, sauce", stock: 23 },
  { producer: 7, category: "fruits-noix", name: "Noix de coco séchée 250 g", price: 2400, unit: "sachet", desc: "Copeaux de coco séchés pour pâtisserie et mueslis.", region: "Sud-Comoé", city: "Assinie", tags: "coco, séché, pâtisserie", stock: 37 },
  { producer: 1, category: "alimentation", name: "Savon de Marseille noir - lot de 3", price: 3900, unit: "lot", desc: "Trois pains de savon noir traditionnel à prix avantageux.", region: "Savanes", city: "Korhogo", tags: "savon, lot, noir", stock: 48, compareAt: 4500 },
  { producer: 4, category: "artisanat-decoration", name: "Sac à main en raphia tressé", price: 13500, unit: "pièce", desc: "Sac à main tressé avec anses en cuir tanné végétal.", region: "Lagunes", city: "Abidjan", tags: "sac, raphia, accessoire", stock: 13, isNew: true },
  { producer: 0, category: "cacao-chocolat", name: "Chocolat blanc & cajou", price: 3900, unit: "tablette", desc: "Chocolat blanc parsemé de cajou concassé.", region: "Sud-Ouest", city: "Soubré", tags: "chocolat, blanc, cajou", stock: 17 },
  { producer: 2, category: "epices-condiments", name: "Gingembre moulu 80 g", price: 1400, unit: "pot", desc: "Gingembre séché et moulu fin.", region: "Savanes", city: "Korhogo", tags: "gingembre, épice", stock: 62, compareAt: 1700 },
  { producer: 8, category: "miel-confitures", name: "Miel & propolis 250 g", price: 5200, unit: "pot", desc: "Miel enrichi de propolis, pour les gorges et l'immunité.", region: "Gôh", city: "Gagnoa", tags: "miel, propolis, santé", stock: 0 },
  { producer: 6, category: "cereales-legumineuses", name: "Sagam extra fin 1 kg", price: 1700, unit: "sachet", desc: "Saga (souchet) extra fin, base des sauces à la viande.", region: "Centre", city: "Katiola", tags: "saga, souchet, sauce", stock: 44 },
  { producer: 7, category: "coco", name: "Farine de coco 500 g", price: 3600, unit: "sachet", desc: "Farine de coco sans gluten, riche en fibres.", region: "Sud-Comoé", city: "Assinie", tags: "farine, coco, sans gluten", stock: 20 },
  { producer: 5, category: "cafe-the", name: "Café en grains éthiopien - édition limitée", price: 8900, unit: "sachet", desc: "Sélection d'un lot floral, torréfaction claire, 200 g.", region: "Tonkpi", city: "Man", tags: "café, éthiopien, rare", stock: 6, compareAt: 9900, featured: true, isNew: true },
  { producer: 4, category: "artisanat-decoration", name: "Couverts en bois - set de 4", price: 7800, unit: "lot", desc: "Quatre couverts en bois d'Iroko, finition huile.", region: "Lagunes", city: "Abidjan", tags: "couverts, bois, table", stock: 25 },
  { producer: 3, category: "alimentation", name: "Cacao pasta 250 g", price: 4200, unit: "sachet", desc: "Pâte de cacao pure pour boissons chaudes et pâtisserie.", region: "Sud-Ouest", city: "Soubré", tags: "cacao, pasta, boisson", stock: 32 },
  { producer: 1, category: "cosmetique-naturelle", name: "Masque visage argile & karité", price: 4800, unit: "pot", desc: "Masque purifiant à l'argile et karité, 100 g.", region: "Savanes", city: "Korhogo", tags: "masque, argile, visage", stock: 15, isNew: true },
];

const ZONES = [
  { name: "Abidjan", desc: "Livraison à domicile dans le district d'Abidjan", price: 1500, freeFrom: 50000, days: 1, districts: ["Cocody", "Yopougon", "Abobo", "Marcory", "Treichville", "Plateau", "Port-Bouët", "Bingerville", "Koumassi", "Adjamé", "Yopougon-Side", "Songon"] },
  { name: "Bouaké", desc: "Capitale du Centre — livraison en 48 h", price: 2500, freeFrom: 80000, days: 2, districts: ["Air France", "Sector 4", "Babengué"] },
  { name: "Yamoussoukro", desc: "Politique — livraison en 48 h", price: 2500, freeFrom: 80000, days: 2, districts: ["Habitat", "Libreville", "Morokro"] },
  { name: "San-Pédro", desc: "Port — livraison en 48 h", price: 3000, freeFrom: 80000, days: 2, districts: ["Badolo", "Digba", "Grapie"] },
  { name: "Korhogo", desc: "Savanes — livraison en 72 h", price: 3500, freeFrom: 100000, days: 3, districts: ["Sidéradougou", "Fakaha", "Soba"] },
  { name: "Daloa", desc: "Haut-Sassandra — livraison en 72 h", price: 3000, freeFrom: 90000, days: 3, districts: ["Pelezi", "Gadouan"] },
  { name: "Man", desc: "Tonkpi — retrait producteur disponible", price: 3000, freeFrom: 90000, days: 3, districts: ["Sangouiné", "Duékoué"] },
  { name: "Retrait producteur", desc: "Retrait gratuit chez le producteur ou en point partenaire", price: 0, freeFrom: 0, days: 0, districts: [] },
];

const PROMOS: {
  code: string;
  desc: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  min: number;
  perUser: number | null;
  uses: number | null;
  category?: string;
  product?: string;
  expired?: boolean;
}[] = [
  { code: "BIENVENUE10", desc: "Offre de bienvenue : -10 % sur la première commande", type: "PERCENTAGE", value: 10, min: 0, perUser: 1, uses: null },
  { code: "AFRIKA20", desc: "-20 % dès 25 000 FCFA d'achat", type: "PERCENTAGE", value: 20, min: 25000, perUser: 2, uses: 200 },
  { code: "LIVRAISON0", desc: "Livraison offerte sur toute la plateforme", type: "FREE_SHIPPING", value: 0, min: 10000, perUser: 3, uses: 300 },
  { code: "CAJOU1500", desc: "1 500 FCFA de remise dès 10 000 FCFA", type: "FIXED", value: 1500, min: 10000, perUser: 2, uses: 150 },
  { code: "KARITE15", desc: "-15 % sur toute la catégorie Cosmétique naturelle", type: "PERCENTAGE", value: 15, min: 0, perUser: 5, uses: 100, category: "cosmetique-naturelle" },
  { code: "CHOCO500", desc: "500 FCFA sur les tablettes de chocolat", type: "FIXED", value: 500, min: 2000, perUser: 5, uses: 120, product: "chocolat-noir-70-tablette-100-g" },
  { code: "SOLDES10", desc: "-10 % sur les produits en promotion", type: "PERCENTAGE", value: 10, min: 5000, perUser: 3, uses: 500 },
  { code: "EXPIRE01", desc: "Code expiré (démonstration des règles)", type: "PERCENTAGE", value: 50, min: 0, perUser: null, uses: 100, expired: true },
];

const FIRST_NAMES = [
  "Aya", "Koffi", "Adjoua", "Moussa", "Fatou", "Yao", "Aminata", "Serge", "Nadège", "Ibrahim",
  "Mariam", "Konan", "Akissi", "Bakary", "Estelle", "Souleymane", "Rachelle", "Abou", "Georgette", "Lamine",
];

const LAST_NAMES = [
  "Kouassi", "Traoré", "Diabaté", "N'Guessan", "Ouattara", "Bamba", "Yeo", "Assi", "Zadi", "Coulibaly",
  "Sangaré", "Koné", "Gnahoré", "Doumbia", "Aka", "Brou", "Dago", "Fofana", "Kéita", "Touré",
];

const STREETS = [
  "Boulevard Latrille", "Rue des Jardins", "Avenue du 7", "Boulevard de Marseille", "Rue du Commerce",
  "Chemin des Palmiers", "Rue 12", "Avenue Charles de Gaulle", "Rue des Cocotiers", "Boulevard VGE",
];

const COMMODITIES = [
  { order: "PENDING_PAYMENT", paid: false, delivery: "PENDING" },
  { order: "PAID", paid: true, delivery: "CONFIRMED" },
  { order: "CONFIRMED", paid: true, delivery: "CONFIRMED" },
  { order: "PREPARING", paid: true, delivery: "PREPARING" },
  { order: "READY_FOR_DELIVERY", paid: true, delivery: "READY" },
  { order: "IN_TRANSIT", paid: true, delivery: "IN_TRANSIT" },
  { order: "DELIVERED", paid: true, delivery: "DELIVERED" },
  { order: "DELIVERED", paid: true, delivery: "DELIVERED" },
  { order: "CANCELLED", paid: false, delivery: "CANCELLED" },
  { order: "REFUNDED", paid: true, delivery: "CANCELLED" },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function clean() {
  const order = [
    "orderEvent", "review", "wishlistItem", "cartItem", "delivery", "payment", "orderItem", "order",
    "promoCode", "deliveryDistrict", "deliveryZone", "productVariant", "product", "category",
    "producer", "newsletterSubscriber", "setting", "address", "user", "country",
  ] as const;
  for (const model of order) {
    await (prisma as unknown as Record<string, { deleteMany: (a?: unknown) => Promise<unknown> }>)[model]!.deleteMany();
  }
}

async function main() {
  console.log("🌱 Seed AFRIKA MARKET…");
  mkdirSync(IMAGES_DIR, { recursive: true });
  await clean();

  // --- Pays ---------------------------------------------------------------
  const countries: Record<string, string> = {};
  for (const c of COUNTRIES) {
    countries[c.code] = (await prisma.country.create({ data: c })).id;
  }
  const CI = countries.CI!;

  // --- Catégories ---------------------------------------------------------
  const categories: Record<string, string> = {};
  for (const [i, c] of CATEGORIES.entries()) {
    const row = await prisma.category.create({
      data: {
        name: c.name,
        slug: slug(c.name),
        description: c.desc,
        position: i,
        imageUrl: resolveImages("categories", slug(c.name), `cat-${slug(c.name)}.svg`, c.name, slug(c.name))[0]!,
      },
    });
    categories[slug(c.name)] = row.id;
    for (const child of c.children ?? []) {
      const sub = await prisma.category.create({
        data: { name: child, slug: slug(child), description: `${child} — ${c.desc}`, position: i, parentId: row.id, imageUrl: row.imageUrl },
      });
      categories[slug(child)] = sub.id;
    }
  }

  // --- Comptes administration --------------------------------------------
  const adminData = [
    { email: "superadmin@afrikamarket.ci", first: "Système", last: "Admin", role: "SUPER_ADMIN" },
    { email: "admin@afrikamarket.ci", first: "Awa", last: "Administratrice", role: "ADMIN" },
    { email: "moderation@afrikamarket.ci", first: "Jean", last: "Modérateur", role: "ADMIN" },
  ];
  const userIds: string[] = [];
  for (const a of adminData) {
    const u = await prisma.user.create({
      data: {
        email: a.email, passwordHash: PASSWORD, role: a.role,
        firstName: a.first, lastName: a.last, phone: "+225 07 07 01 02 03", countryId: CI,
      },
    });
    userIds.push(u.id);
  }

  // --- Producteurs --------------------------------------------------------
  const producerIds: string[] = [];
  for (const [i, p] of PRODUCERS.entries()) {
    const email = `${slug(p.name).replace(/-/g, ".").slice(0, 20)}@afrikamarket.ci`;
    const user = await prisma.user.create({
      data: {
        email, passwordHash: PASSWORD, role: "PRODUCER",
        firstName: p.name.split(" ")[0]!, lastName: p.city, phone: `+225 05 0${i} 1${i} 2${i} 3${i}`,
        countryId: CI,
      },
    });
    const producer = await prisma.producer.create({
      data: {
        userId: user.id, name: p.name, slug: slug(p.name), description: p.desc, story: p.story,
        logoUrl: resolveImages("producers", slug(p.name), `producer-${i}.svg`, p.name, "artisanat-decoration")[0]!,
        coverUrl: findLocalPhotos("producers", `${slug(p.name)}--cover`)[0] ?? null,
        countryId: CI, region: p.region, city: p.city, specialties: p.tags,
        certifications: p.certs, status: "APPROVED",
      },
    });
    producerIds.push(producer.id);
  }

  // --- Clients ------------------------------------------------------------
  const clientIds: string[] = [];
  for (let i = 0; i < 20; i++) {
    const first = FIRST_NAMES[i]!;
    const last = LAST_NAMES[i]!;
    const u = await prisma.user.create({
      data: {
        email: `${slug(first)}.${slug(last)}${i}@mail.ci`,
        passwordHash: PASSWORD,
        role: "CLIENT",
        firstName: first,
        lastName: last,
        phone: `+225 0${(i % 7) + 1} ${10 + i} ${20 + i} ${30 + i} ${40 + i}`,
        countryId: CI,
        createdAt: daysAgo(90 - i * 3),
      },
    });
    clientIds.push(u.id);
    await prisma.address.create({
      data: {
        userId: u.id, label: i % 2 ? "Bureau" : "Domicile", firstName: first, lastName: last,
        phone: u.phone!, country: "Côte d'Ivoire", city: "Abidjan",
        district: pick(ZONES[0]!.districts, i), neighborhood: `Quartier ${i + 1}`,
        street: `${STREETS[i % STREETS.length]} ${10 + i}`, isDefault: true,
      },
    });
  }

  // --- Zones de livraison -------------------------------------------------
  const zoneIds: string[] = [];
  for (const [i, z] of ZONES.entries()) {
    const row = await prisma.deliveryZone.create({
      data: {
        countryId: CI, name: z.name, description: z.desc, basePrice: z.price,
        freeFrom: z.freeFrom || null, estimatedDays: z.days, isActive: true, position: i,
        allowCashOnDelivery: z.name !== "Retrait producteur",
        districts: { create: z.districts.map((d) => ({ name: d })) },
      },
    });
    zoneIds.push(row.id);
  }
  // --- Produits -----------------------------------------------------------
  const productIds: string[] = [];
  const productSlugs: string[] = [];
  const productImages: string[] = [];
  for (const [i, p] of PRODUCTS.entries()) {
    const s = slug(p.name);
    const imageList = resolveImages("products", s, `${s}.svg`, p.name, p.category);
    productImages.push(imageList[0]!);
    const product = await prisma.product.create({
      data: {
        producerId: producerIds[p.producer]!,
        categoryId: categories[p.category]!,
        name: p.name,
        slug: s,
        description: `${p.desc}\n\nOrigine : ${p.city}, région ${p.region} (Côte d'Ivoire). Méthode : ${
          p.method ?? "production artisanale locale"
        }.${p.harvest ? ` Récolte : ${p.harvest}.` : ""}`,
        shortDescription: p.desc,
        price: p.price,
        compareAtPrice: p.compareAt ?? null,
        images: JSON.stringify(imageList),
        stock: p.stock,
        lowStockThreshold: 5,
        unit: p.unit,
        weight: null,
        sku: `AM-${String(i + 1).padStart(4, "0")}`,
        countryId: CI,
        region: p.region,
        city: p.city,
        originMethod: p.method ?? null,
        harvestPeriod: p.harvest ?? null,
        conservation: "Lieu frais et sec, à l'abri de la lumière.",
        characteristics: JSON.stringify([
          { label: "Origine", value: `${p.city} — Côte d'Ivoire` },
          { label: "Conditionnement", value: p.unit },
          { label: "Artisanat", value: "Production locale" },
        ]),
        tags: p.tags,
        isActive: true,
        isFeatured: p.featured ?? false,
        isNew: p.isNew ?? false,
        createdAt: daysAgo(120 - i),
      },
    });
    productIds.push(product.id);
    productSlugs.push(s);

    // Variantes sur certains produits
    if (i % 7 === 0) {
      await prisma.productVariant.createMany({
        data: [
          { productId: product.id, name: "Format solo", sku: `${product.sku}-S`, price: p.price, stock: Math.max(0, Math.floor(p.stock / 2)), attributes: JSON.stringify({ format: "solo" }) },
          { productId: product.id, name: "Lot de 3", sku: `${product.sku}-X3`, price: Math.round(p.price * 2.7), stock: Math.max(0, Math.floor(p.stock / 3)), attributes: JSON.stringify({ format: "lot-3" }) },
        ],
      });
    }
  }

  // --- Codes promo --------------------------------------------------------
  const promoIds: Record<string, string> = {};
  for (const p of PROMOS) {
    const row = await prisma.promoCode.create({
      data: {
        code: p.code,
        description: p.desc,
        type: p.type,
        scope: p.product ? "PRODUCT" : p.category ? "CATEGORY" : "GLOBAL",
        value: p.value,
        minimumAmount: p.min,
        maximumUses: p.uses,
        maximumUsesPerUser: p.perUser,
        startsAt: daysAgo(60),
        endsAt: p.expired ? daysAgo(5) : new Date(Date.now() + 60 * 86_400_000),
        isActive: true,
        productId: p.product ? (productIds[productSlugs.indexOf(p.product)] ?? null) : null,
        categoryId: p.category ? (categories[p.category] ?? null) : null,
      },
    });
    promoIds[p.code] = row.id;
  }

  // --- Commandes ----------------------------------------------------------
  const statusPattern = [
    ...COMMODITIES,
    ...COMMODITIES,
    ...COMMODITIES,
    ...COMMODITIES,
  ];
  const salesCount = new Map<string, number>();

  for (const [i, tpl] of statusPattern.entries()) {
    const clientId = clientIds[i % clientIds.length]!;
    const created = daysAgo(statusPattern.length - i, 8 + (i % 9));
    const lineCount = (i % 3) + 1;
    const lines: { productIdx: number; qty: number; price: number }[] = [];
    for (let k = 0; k < lineCount; k++) {
      const productIdx = (i * 3 + k * 7) % productIds.length;
      const qty = ((i + k) % 2) + 1;
      const price = PRODUCTS[productIdx]!.price;
      lines.push({ productIdx, qty, price });
      salesCount.set(productIds[productIdx]!, (salesCount.get(productIds[productIdx]!) ?? 0) + qty);
    }

    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const usePromo = i % 5 === 0 && subtotal > 12000;
    const promoCode = usePromo ? (i % 10 === 0 ? "AFRIKA20" : "BIENVENUE10") : null;
    const discount = promoCode === "AFRIKA20" ? Math.round(subtotal * 0.2) : promoCode === "BIENVENUE10" ? Math.round(subtotal * 0.1) : 0;
    const zoneIdx = i % ZONES.length;
    const zoneId = zoneIds[zoneIdx]!;
    const zone = ZONES[zoneIdx]!;
    const shipping = zone.name === "Retrait producteur" || subtotal - discount >= (zone.freeFrom ?? Infinity) ? 0 : zone.price;
    const total = Math.max(0, subtotal - discount) + shipping;
    const method = ["wave", "orange", "mtn", "moov", "card", "cash"][i % 6]!;
    const isCash = method === "cash";

    const number = `AM-${created.toISOString().slice(0, 10).replace(/-/g, "")}-${String(i + 1).padStart(5, "0")}`;
    const client = await prisma.user.findUniqueOrThrow({ where: { id: clientId } });
    const district = pick(ZONES[0]!.districts, i);
    const address = {
      firstName: client.firstName, lastName: client.lastName, phone: client.phone ?? "",
      email: client.email, country: "Côte d'Ivoire", city: zone.name === "Abidjan" ? "Abidjan" : zone.name,
      district, neighborhood: `Quartier ${i + 1}`, street: `${STREETS[i % STREETS.length]} ${10 + i}`,
      additionalInfo: "", zoneName: zone.name,
    };

    const order = await prisma.order.create({
      data: {
        number,
        userId: clientId,
        email: client.email,
        status: tpl.order,
        subtotal,
        shippingCost: shipping,
        discount,
        total,
        currency: "XOF",
        shippingAddress: JSON.stringify(address),
        billingAddress: JSON.stringify(address),
        promoCodeId: promoCode ? promoIds[promoCode] : null,
        promoCode,
        paymentMethod: method,
        isPaid: tpl.paid,
        paidAt: tpl.paid ? created : null,
        cancelledAt: tpl.order === "CANCELLED" || tpl.order === "REFUNDED" ? daysAgo(statusPattern.length - i - 2) : null,
        createdAt: created,
        zoneId,
        items: {
          create: lines.map((l) => {
            const p = PRODUCTS[l.productIdx]!;
            return {
              productId: productIds[l.productIdx]!,
              producerId: producerIds[p.producer]!,
              productName: p.name,
              productSlug: productSlugs[l.productIdx]!,
              sku: `AM-${String(l.productIdx + 1).padStart(4, "0")}`,
              imageUrl: productImages[l.productIdx] ?? "",
              unit: p.unit,
              origin: `${p.city} — Côte d'Ivoire`,
              producerName: PRODUCERS[p.producer]!.name,
              quantity: l.qty,
              unitPrice: p.price,
              total: p.price * l.qty,
            };
          }),
        },
      },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: isCash ? "cash" : method,
        providerRef: isCash ? null : `SBX-${number.replace(/-/g, "")}`,
        amount: total,
        currency: "XOF",
        status: tpl.paid ? "PAID" : tpl.order === "CANCELLED" ? "CANCELLED" : "PENDING",
        paidAt: tpl.paid ? created : null,
        metadata: JSON.stringify({ method }),
      },
    });

    await prisma.delivery.create({
      data: {
        orderId: order.id,
        zoneId,
        method: zone.name === "Retrait producteur" ? "PICKUP_PRODUCER" : "HOME",
        status: tpl.delivery,
        recipient: `${client.firstName} ${client.lastName}`,
        phone: client.phone ?? "",
        addressSnapshot: JSON.stringify(address),
        shippingCost: shipping,
        trackingNumber: `TRK${(i + 1000).toString(16).toUpperCase().padStart(6, "0")}`,
        estimatedDate: new Date(created.getTime() + zone.days * 86_400_000),
        deliveredAt: tpl.delivery === "DELIVERED" ? daysAgo(statusPattern.length - i - 1) : null,
        createdAt: created,
      },
    });

    await prisma.orderEvent.createMany({
      data: [
        { orderId: order.id, status: "CREATED", label: "Commande créée", note: `Numéro ${number}`, createdAt: created },
        { orderId: order.id, status: tpl.order, label: tpl.order, note: null, createdAt: daysAgo(Math.max(0, statusPattern.length - i - 1)) },
      ],
    });
  }

  // Mise à jour des compteurs de vente
  for (const [productId, count] of salesCount) {
    await prisma.product.update({ where: { id: productId }, data: { salesCount: count } });
  }

  // --- Avis ---------------------------------------------------------------
  const COMMENTS = [
    "Produit reçu en deux jours, emballage soigné. La qualité est au rendez-vous, on retrouve vraiment le goût d'autrefois.",
    "Excellent rapport qualité/prix. Ma famille a adoré, je recommande.",
    "Conforme à la description et l'origine est bien indiquée. Je rachèterai.",
    "Livraison à Cocody rapide. Le producteur répond aux questions, c'est appréciable.",
    "Un peu moins de goûter que prévu mais correct pour le prix.",
    "C'est du vrai, on sent le fait main. Bravo aux producteurs.",
    "Je commande régulièrement depuis deux mois, jamais de déception.",
    "Très bon produit, je vais essayer les autres saveurs.",
  ];
  let reviewIndex = 0;
  for (const [i, clientId] of clientIds.entries()) {
    const productIdx = (i * 5) % productIds.length;
    const rating = [5, 4, 5, 3, 4, 5, 4, 5][i % 8]!;
    await prisma.review.create({
      data: {
        productId: productIds[productIdx]!,
        userId: clientId,
        rating,
        comment: pick(COMMENTS, reviewIndex),
        status: i < 16 ? "APPROVED" : "PENDING",
        createdAt: daysAgo(60 - i * 2),
      },
    });
    reviewIndex++;
    if (i % 6 === 0) {
      await prisma.wishlistItem.create({
        data: { userId: clientId, productId: productIds[(productIdx + 3) % productIds.length]! },
      });
    }
  }

  // --- Newsletter ---------------------------------------------------------
  for (let i = 0; i < 14; i++) {
    await prisma.newsletterSubscriber.create({
      data: {
        email: `newsletter${i}@mail.ci`,
        source: ["footer", "homepage", "popup"][i % 3]!,
        isActive: i !== 13,
        createdAt: daysAgo(40 - i),
      },
    });
  }

  // --- Paramètres globaux -------------------------------------------------
  await prisma.setting.createMany({
    data: [
      { key: "site.name", value: "AFRIKA MARKET", label: "Nom du site" },
      { key: "site.tagline", value: "La marketplace qui rapproche l'Afrique de ses consommateurs", label: "Signature" },
      { key: "delivery.free_threshold_default", value: "50000", label: "Seuil de livraison offerte par défaut" },
      { key: "checkout.guest_enabled", value: "true", label: "Commande en tant qu'invité" },
      { key: "newsletter.enabled", value: "true", label: "Newsletter activée" },
    ],
  });

  // --- Recalcul des notes -------------------------------------------------
  const products = await prisma.product.findMany({ select: { id: true } });
  for (const p of products) {
    const agg = await prisma.review.aggregate({
      where: { productId: p.id, status: "APPROVED" },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.product.update({
      where: { id: p.id },
      data: {
        averageRating: Number((agg._avg.rating ?? 0).toFixed(1)),
        reviewCount: agg._count,
      },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    producers: await prisma.producer.count(),
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    orders: await prisma.order.count(),
    reviews: await prisma.review.count(),
    zones: await prisma.deliveryZone.count(),
    promos: await prisma.promoCode.count(),
  };
  console.log("✅ Seed terminé :", counts);
  console.log("🔑 Comptes de test : superadmin@afrikamarket.ci, admin@afrikamarket.ci, vendeur… / Afrika2026!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
