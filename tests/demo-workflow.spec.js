import { test, expect } from "@playwright/test";

test("live demo logins open the dashboard and keep employee data scoped", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  async function login(email) {
    await page.goto("/");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByLabel("Workspace ID").fill("evergreen-demo");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("AssetQDemo!2026");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Good / })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await login("admin@evergreen.example.test");
  await expect(page.locator(".kpi").first().locator("strong")).toHaveText("80");
  await page.screenshot({
    path: testInfo.outputPath("demo-dashboard.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "People & teams", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(30);
  await page
    .getByRole("button", { name: "Roles & permissions", exact: true })
    .click();
  await expect(page.locator(".role-card")).toHaveCount(7);
  await page
    .getByRole("button", { name: "Visual workspace", exact: true })
    .click();
  await expect(page.locator(".floor-plan img")).toBeVisible();
  await expect(page.locator(".map-pin").first()).toBeVisible();
  await page.locator(".profile").click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await login("employee@evergreen.example.test");
  await page
    .getByRole("button", { name: "Asset register", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page.getByRole("button", { name: /^Helpdesk/ }).click();
  await expect(page.locator("tbody tr")).toHaveCount(3);
  expect(errors).toEqual([]);
});
