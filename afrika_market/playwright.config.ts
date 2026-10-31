import { defineConfig, devices } from "@playwright/test";

/**
 * Tests E2E.
 *  - Local :        npm run test:e2e           (lance `npm run dev` automatiquement)
 *  - Production :   E2E_BASE_URL=https://afrika-market-tis9.vercel.app npm run test:e2e
 *
 * 1 seul worker : le rate limiting (5 connexions / minute / IP) casserait des tests parallèles.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  // En mode `next dev`, chaque page est compilée à la première visite (10 à 40 s) :
  // les délais sont larges exprès. Sur un build de production, tout est rapide.
  timeout: 180_000,
  expect: { timeout: 30_000 },
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    actionTimeout: 30_000,
    navigationTimeout: 90_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run dev", url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
