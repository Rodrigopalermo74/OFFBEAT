import { expect, test } from "@playwright/test";

test("Portada y mapa: Enter arranca, los números siguen cada recorrido y S abre el Studio", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByTestId("start")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("track-groove-lab")).toBeVisible();

  await page.keyboard.press("2");
  await expect(page.locator(".level-title")).toHaveText("Bajo en el offbeat");
  await page.keyboard.press("Escape");

  await page.keyboard.press("s");
  await expect(page.getByRole("heading", { name: "Studio" })).toBeVisible();
  expect(errors).toEqual([]);
});
