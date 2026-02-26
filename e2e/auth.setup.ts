import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test as setup } from "@playwright/test";
import type { Page } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, "../playwright/.auth/user.json");

const credentials = {
  email: process.env.PRISM_E2E_EMAIL ?? "admin@example.com",
  username: process.env.PRISM_E2E_USERNAME ?? "admin",
  password: process.env.PRISM_E2E_PASSWORD ?? "StrongPassword!123",
};

async function loginWithPassword(page: Page) {
  await page.goto("/login");
  await page.locator("#username_or_email").fill(credentials.username);
  await page.locator("#password").fill(credentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
}

setup("bootstrap authentication and save session", async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto("/auth/setup");

  await Promise.any([
    page.locator("#setup_email").waitFor({ state: "visible", timeout: 10_000 }),
    page
      .getByText("Authentication is already enabled")
      .waitFor({ state: "visible", timeout: 10_000 }),
    page.getByText("Sign in to Prism V2").waitFor({ state: "visible", timeout: 10_000 }),
  ]);

  const canRunSetupFlow = await page.locator("#setup_email").isVisible().catch(() => false);
  if (!canRunSetupFlow) {
    await loginWithPassword(page);
    await page.context().storageState({ path: authFile });
    return;
  }

  await page.locator("#setup_email").fill(credentials.email);
  await page.getByRole("button", { name: "Request setup OTP" }).click();

  await expect(page.locator("#setup_otp_challenge")).not.toHaveValue("");
  await expect(page.locator("#setup_otp_code")).not.toHaveValue("");

  await page.locator("#setup_username").fill(credentials.username);
  await page.locator("#setup_password").fill(credentials.password);
  await page.getByRole("button", { name: "Enable authentication" }).click();

  const dashboardVisible = await page
    .waitForURL("**/dashboard", { timeout: 10_000 })
    .then(() => true)
    .catch(() => false);

  if (!dashboardVisible) {
    await loginWithPassword(page);
  }

  await page.context().storageState({ path: authFile });
});
