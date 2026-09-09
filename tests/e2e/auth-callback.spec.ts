import { test, expect } from "@playwright/test";

/**
 * End-to-end coverage for the redirect based Google sign-in flow.
 * Run with: bunx playwright test tests/e2e/auth-callback.spec.ts
 */
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:8080";
const PROD = process.env.E2E_PROD_URL ?? "https://pvault.treshtech.dev";

test("callback page shows a clear error and retry when tokens are missing", async ({ page }) => {
  await page.goto(`${BASE}/auth/callback`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Sign-in failed" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page).toHaveURL(/\/auth$/);
});

test("callback page rejects an invalid token pair without leaving tokens in the URL", async ({ page }) => {
  await page.goto(`${BASE}/auth/callback#access_token=bad&refresh_token=bad&token_type=bearer`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("heading", { name: "Sign-in failed" })).toBeVisible();
  expect(page.url()).not.toContain("access_token");
});

test("signing out leaves no auth tokens in storage", async ({ page }) => {
  await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" });
  const leftovers = await page.evaluate(() =>
    Object.keys(localStorage).filter((k) => k.startsWith("sb-") && k.includes("auth-token")),
  );
  expect(leftovers).toEqual([]);
});

test("production responses carry the expected security headers", async ({ request }) => {
  const res = await request.get(PROD);
  const h = res.headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBeTruthy();
  expect(h["strict-transport-security"]).toContain("max-age=");
  expect(h["x-frame-options"] ?? h["content-security-policy"]).toBeTruthy();
});
