import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { findLocalPhotos } from "../prisma/image-files";
import { coverImage, parseImages, PLACEHOLDER_IMAGE } from "@/lib/images";

describe("findLocalPhotos", () => {
  let root: string;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), "am-photos-"));
    const dir = join(root, "public", "images", "products");
    mkdirSync(dir, { recursive: true });
    for (const f of [
      "beurre-de-karite.webp",
      "beurre-de-karite--3.jpg",
      "beurre-de-karite--2.webp",
      "beurre-de-karite--10.png",
      "beurre-de-karite.svg", // visuel de substitution : jamais pris pour une photo
      "coussin-bogolan-lot-de-2.jpg", // un slug qui finit par un chiffre reste une photo principale
      "coussin-bogolan.jpg",
      "notes.txt",
    ]) {
      writeFileSync(join(dir, f), "x");
    }
  });

  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it("retourne la photo principale puis les suivantes dans l'ordre numérique", () => {
    expect(findLocalPhotos("products", "beurre-de-karite", root)).toEqual([
      "/images/products/beurre-de-karite.webp",
      "/images/products/beurre-de-karite--2.webp",
      "/images/products/beurre-de-karite--3.jpg",
      "/images/products/beurre-de-karite--10.png",
    ]);
  });

  it("ignore les SVG de substitution", () => {
    expect(findLocalPhotos("products", "beurre-de-karite", root).some((p) => p.endsWith(".svg"))).toBe(false);
  });

  it("ne confond pas deux slugs dont l'un préfixe l'autre", () => {
    expect(findLocalPhotos("products", "coussin-bogolan", root)).toEqual(["/images/products/coussin-bogolan.jpg"]);
    expect(findLocalPhotos("products", "coussin-bogolan-lot-de-2", root)).toEqual([
      "/images/products/coussin-bogolan-lot-de-2.jpg",
    ]);
  });

  it("retourne une liste vide sans photo ou sans dossier", () => {
    expect(findLocalPhotos("products", "inconnu", root)).toEqual([]);
    expect(findLocalPhotos("categories", "cacao", root)).toEqual([]);
  });
});

describe("parseImages", () => {
  it("lit la liste JSON stockée en base", () => {
    expect(parseImages('["/a.webp","/b.webp"]')).toEqual(["/a.webp", "/b.webp"]);
  });

  it("tolère un JSON invalide, vide ou mal typé", () => {
    expect(parseImages("pas du json")).toEqual([]);
    expect(parseImages("")).toEqual([]);
    expect(parseImages(null)).toEqual([]);
    expect(parseImages('{"a":1}')).toEqual([]);
    expect(parseImages('["/a.webp", 3, null, ""]')).toEqual(["/a.webp"]);
  });

  it("utilise le visuel de substitution quand il n'y a aucune image", () => {
    expect(coverImage("[]")).toBe(PLACEHOLDER_IMAGE);
    expect(coverImage('["/a.webp"]')).toBe("/a.webp");
  });
});
