import { expect, test } from "@playwright/test";

test("create profile and register models from UI", async ({ page }) => {
  const profileName = `e2e-profile-${Date.now()}`;
  const endpointUrl = `https://e2e-${Date.now()}.example.com/v1`;

  await page.goto("/profiles");
  await expect(page.getByText("Provider Profiles")).toBeVisible();

  await page.locator("#profile_name").fill(profileName);
  await page.locator("#endpoint_url").fill(endpointUrl);
  await page.locator("#api_key").fill("sk-e2e-key");
  await page.getByRole("button", { name: "Create profile" }).click();

  const profileCard = page.locator("div.rounded.border.p-4").filter({ hasText: profileName });
  await expect(profileCard).toBeVisible();
  await profileCard.getByRole("link", { name: "Open" }).click();

  await expect(page.getByText(profileName)).toBeVisible();

  await page.getByPlaceholder("gpt-5.2, gpt-5.3-codex").fill("gpt-5.2");
  await page.getByRole("button", { name: "Upsert model IDs" }).click();
  await expect(
    page.locator("div.rounded.border.p-3").filter({ hasText: "gpt-5.2" }).first(),
  ).toBeVisible();
});
