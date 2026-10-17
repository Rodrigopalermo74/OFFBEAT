import { expect, test } from "@playwright/test";

test("arranca la noche, suena el transporte y se edita el groove", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await page.getByTestId("start").click();
  await expect(page.getByTestId("chords")).toContainText("Am9");

  const step = page.getByTestId("step-kick-2");
  await expect(step).toHaveAttribute("aria-pressed", "false");
  await step.click();
  await expect(step).toHaveAttribute("aria-pressed", "true");

  await page.getByTestId("play").click();
  // El playhead del secuenciador avanza: algún paso queda marcado como actual.
  await expect(page.locator(".step-seq__cell.is-current").first()).toBeVisible();
  await page.getByTestId("play").click();

  expect(errors).toEqual([]);
});

test("el piano roll mantiene un frame rate fluido con 512 notas", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("start").click();
  await page.getByTestId("stress").check();
  await page.waitForTimeout(2500);
  const fps = Number((await page.getByTestId("fps").textContent())?.replace(/\D/g, ""));
  // Umbral conservador para headless/CI; en un navegador real el objetivo es 60 fps.
  expect(fps).toBeGreaterThan(30);
});
