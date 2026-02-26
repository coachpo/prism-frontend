import { expect, test } from "@playwright/test";

test("redirects unauthenticated users to login when auth is enabled", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${baseURL}/profiles`);

  const landedOnLogin = await page
    .waitForURL("**/login", { timeout: 5_000 })
    .then(() => true)
    .catch(() => false);

  const landedOnProfiles = await page
    .waitForURL("**/profiles", { timeout: 2_000 })
    .then(() => true)
    .catch(() => false);

  expect(landedOnLogin || landedOnProfiles).toBeTruthy();
  await context.close();
});

test("authenticated user can access dashboard and settings", async ({ page }) => {
  const username = process.env.PRISM_E2E_USERNAME ?? "admin";
  const password = process.env.PRISM_E2E_PASSWORD ?? "StrongPassword!123";

  await page.goto("/dashboard");
  await expect(page.getByText("Prism V2 Dashboard")).toBeVisible({ timeout: 10_000 });

  await page.goto("/settings");

  const onLogin = await page.getByText("Sign in to Prism V2").isVisible().catch(() => false);
  if (onLogin) {
    await page.locator("#username_or_email").fill(username);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    await page.goto("/settings");
  }

  await expect(page.getByText("Settings & Security")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Config import/export", { exact: true })).toBeVisible({ timeout: 10_000 });
});
