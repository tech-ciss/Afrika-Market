import type { Page } from "@playwright/test";

export const PASSWORD = "Afrika2026!";
export const ACCOUNTS = {
  client: "aya.kouassi0@mail.ci",
  producer: "vendeur@afrikamarket.ci",
  admin: "admin@afrikamarket.ci",
} as const;

export async function login(page: Page, email: string, callbackUrl?: string) {
  await page.goto(callbackUrl ? `/connexion?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/connexion");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  // La page de destination peut être compilée à la volée en mode dev : on attend largement.
  await page.waitForURL((url) => !url.pathname.startsWith("/connexion"), { timeout: 90_000 });
}
