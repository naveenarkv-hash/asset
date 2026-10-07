import { test, expect } from "@playwright/test";
test("workspace onboarding, assets, tickets, import, automation, layout, and mobile", async ({
  page,
}, testInfo) => {
  let errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByLabel("Organization name").fill("Northstar Industries");
  await page.getByLabel("Your full name").fill("Alex Morgan");
  await page.getByLabel("Workspace ID").fill("northstar-" + Date.now());
  await page.getByLabel("Work email").fill("alex@example.test");
  await page.getByLabel("Password", { exact: true }).fill("TestPassword123!");
  await page.getByRole("button", { name: "Create my workspace" }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Good / })).toBeVisible();

  await page.getByRole("button", { name: "Master data", exact: true }).click();
  await page.getByRole("button", { name: "Add record", exact: true }).click();
  await page.getByLabel("Location code").fill("HQ");
  await page.getByLabel("Location name").fill("Headquarters");
  await page.getByLabel("Location type").selectOption("SITE");
  await page
    .getByRole("button", { name: "Create Location", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: /^Departments/ }).click();
  await page.getByRole("button", { name: "Add record", exact: true }).click();
  await page.getByLabel("Department code").fill("ENG");
  await page.getByLabel("Department name").fill("Engineering");
  await page.getByLabel("Cost center", { exact: true }).fill("CC-100");
  await page
    .getByRole("button", { name: "Create Department", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page
    .getByRole("button", { name: "People & teams", exact: true })
    .click();
  await page.getByRole("button", { name: "Add user", exact: true }).click();
  await page.getByLabel("Full name").fill("Sam Taylor");
  await page.getByLabel("Work email").fill("sam@example.test");
  await page
    .getByLabel("Role", { exact: true })
    .selectOption({ label: "Employee" });
  await page.getByLabel("Initial password").fill("TestPassword123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page
    .getByRole("button", { name: "Asset register", exact: true })
    .click();
  await page.getByRole("button", { name: "Add asset", exact: true }).click();
  await page.getByLabel("Asset tag").fill("AST-001");
  await page.getByLabel("Asset name").fill("MacBook Pro 14");
  await page
    .getByLabel("Category", { exact: true })
    .selectOption({ label: "IT equipment" });
  await page
    .getByLabel("Location", { exact: true })
    .selectOption({ label: "Headquarters" });
  await page
    .getByLabel("Owner", { exact: true })
    .selectOption({ label: "Sam Taylor" });
  await page.getByLabel("Lifecycle state").selectOption("ASSIGNED");
  await page.getByLabel("Acquisition value").fill("2400");
  await page.getByRole("button", { name: "Create Asset", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByText("MacBook Pro 14", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Setup guide", exact: true }).click();
  await page.getByRole("checkbox").click();
  await page.waitForFunction(
    () => document.querySelector(".onboard-review input").checked,
  );
  await page.getByRole("button", { name: "Go live", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByText("Workspace live", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Helpdesk", exact: true }).click();
  await page.getByRole("button", { name: "Raise ticket", exact: true }).click();
  await page
    .getByLabel("What do you need help with?")
    .fill("Laptop cannot boot");
  await page
    .getByLabel("Describe the issue")
    .fill("The screen is black and laptop will not power on.");
  await page
    .getByLabel("Related asset")
    .selectOption({ label: "MacBook Pro 14" });
  await page
    .getByRole("button", { name: "Suggest category & priority" })
    .click();
  await page.getByText(/Hardware issue/).waitFor();
  await page.getByRole("button", { name: "Apply suggestions" }).click();
  await page
    .getByRole("button", { name: "Submit ticket", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByText("Laptop cannot boot", { exact: true }).click();
  await page.getByLabel("Ticket status").selectOption("IN_PROGRESS");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page
    .getByLabel("Add a reply")
    .fill("Investigating with the service vendor.");
  await page.getByRole("button", { name: "Post reply" }).click();
  await page
    .getByText("Investigating with the service vendor.", { exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.screenshot({
    path: testInfo.outputPath("dashboard.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Asset register", exact: true })
    .click();
  await page.getByRole("button", { name: "Import CSV", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "assets.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "code,name,category_code,location_code,status,cost\nAST-002,Office printer,CAT-IT,HQ,IN_STOCK,400\n",
    ),
  });
  await page
    .getByRole("button", { name: "Import assets", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await expect(page.getByText("Office printer", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: /^Automation/ })
    .first()
    .click();
  await page.getByRole("button", { name: /Threshold: 30 days/ }).click();
  await page.getByLabel("Days before warranty expiry").fill("60");
  await page.getByRole("button", { name: "Save threshold" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await expect(
    page.getByRole("button", { name: /Threshold: 60 days/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Visual workspace", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add floor plan", exact: true })
    .first()
    .click();
  await page.getByLabel("Floor plan name").fill("HQ floor");
  await page
    .getByLabel("Location", { exact: true })
    .selectOption({ label: "Headquarters" });
  await page
    .getByRole("button", { name: "Create Layout", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page
    .getByLabel("Select asset to place")
    .selectOption({ label: "Office printer · AST-002" });
  await page.locator(".floor-plan").click({ position: { x: 200, y: 150 } });
  await expect(
    page.getByRole("button", { name: "Office printer · In Stock" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page
        .locator(".sidebar")
        .evaluate((el) => el.getBoundingClientRect().right),
    )
    .toBeLessThanOrEqual(0);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.locator(".sidebar")).toHaveClass(/mobile-open/);
  await page
    .getByRole("button", { name: "Asset register", exact: true })
    .click();
  await expect(page.getByText("Office printer", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await expect
    .poll(() =>
      page
        .locator(".sidebar")
        .evaluate((el) => el.getBoundingClientRect().right),
    )
    .toBeLessThanOrEqual(0);
  await page.screenshot({
    path: testInfo.outputPath("mobile.png"),
    fullPage: true,
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  if (overflow) throw Error("Mobile layout overflows");
  if (errors.length) throw Error(errors.join("\n"));
});
