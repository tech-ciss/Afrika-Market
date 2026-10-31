import { expect, test } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

/**
 * Happy path du cahier (§42) :
 * fiche produit → panier → checkout → paiement (sandbox) → confirmation.
 */
test("parcours d'achat complet en paiement sandbox @mobile", async ({ page }) => {
  await login(page, ACCOUNTS.client);

  // 1. Fiche produit + ajout au panier
  await page.goto("/produits/cacao-pasta-250-g");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/cacao/i);
  await page.getByRole("button", { name: "Ajouter au panier" }).first().click();
  await expect(page.getByText("Ajouté au panier").first()).toBeVisible();

  // 2. Panier → checkout
  await page.goto("/panier");
  await page.getByRole("link", { name: "Passer au paiement" }).click();
  await expect(page).toHaveURL(/\/checkout/);

  // 3. Coordonnées / adresse : on complète uniquement ce qui est vide.
  const fillIfEmpty = async (selector: string, value: string) => {
    const field = page.locator(selector).first();
    if (!(await field.count())) return;
    if (!(await field.inputValue())) await field.fill(value);
  };
  await fillIfEmpty("#phone", "+225 07 07 07 07 07");
  await fillIfEmpty("#firstName", "Aya");
  await fillIfEmpty("#lastName", "Kouassi");
  await fillIfEmpty("#street", "Boulevard Latrille, R+2");

  const city = page.locator("select#city");
  if ((await city.count()) && !(await city.inputValue())) await city.selectOption({ index: 1 });
  const district = page.locator("select#district");
  if ((await district.count()) && !(await district.inputValue())) await district.selectOption({ index: 1 });
  await fillIfEmpty("input#district", "Cocody");

  // 4. Livraison + paiement
  await page.locator('input[name="zoneId"]').first().check();
  await page.locator('input[name="paymentMethod"][value="wave"]').check();

  // 5. Confirmation de commande → page de paiement sandbox
  await page.getByRole("button", { name: /Confirmer la commande/ }).click();
  // Si le test échoue ici, ouvrir la capture d'écran : un message d'erreur de validation y est visible.
  await expect(page).toHaveURL(/\/paiement\//, { timeout: 60_000 });
  await expect(page.getByText(/AM-\d{8}-\d{5}/)).toBeVisible();

  // 6. Paiement simulé → confirmation
  await page.getByRole("button", { name: /Confirmer le paiement/ }).click();
  await expect(page).toHaveURL(/\/confirmation/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Merci/);
});
