import { expect, test } from "@playwright/test";
import { ACCOUNTS, login } from "./helpers";

test.describe("Contrôle d'accès par rôle", () => {
  test("un visiteur est renvoyé vers la connexion sur /admin, /vendeur et /compte", async ({ page }) => {
    for (const path of ["/admin", "/vendeur", "/compte"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/connexion/);
    }
  });

  test("un client ne peut pas ouvrir l'administration", async ({ page }) => {
    await login(page, ACCOUNTS.client);
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin/);
    await expect(page).toHaveURL(/\/compte/);
  });

  test("un administrateur accède au back-office", async ({ page }) => {
    await login(page, ACCOUNTS.admin, "/admin");
    await expect(page).toHaveURL(/\/admin/);
  });
});
