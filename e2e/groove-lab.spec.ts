import { expect, test } from "@playwright/test";

test("Recreate: programar el four on the floor desbloquea el siguiente nivel", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await page.getByTestId("start").click();
  await expect(page.getByTestId("level-bedroom-00-recreate-02")).toBeDisabled();
  await page.getByTestId("level-bedroom-00-recreate-01").click();

  // Atajo de teclado: espacio arranca el loop.
  await page.keyboard.press("Space");
  await expect(page.getByTestId("play")).toContainText("Stop");

  // Un intento incompleto no pasa y marca lo que falta.
  await page.getByTestId("step-kick-0").click();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("result")).toContainText("25%");
  await expect(page.locator(".step-seq__cell.is-missed")).toHaveCount(3);

  for (const step of [4, 8, 12]) await page.getByTestId(`step-kick-${step}`).click();
  await page.getByTestId("drop").click();
  await expect(page.getByTestId("result")).toContainText("100%");

  await page.getByTestId("next").click();
  await expect(page.getByRole("heading", { name: "El hat en el contratiempo" })).toBeVisible();

  // El progreso queda guardado al volver al mapa.
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("level-bedroom-00-recreate-02")).toBeEnabled();
  expect(errors).toEqual([]);
});

test("Fix the Groove: ajustar el swing sube la crowd energy y pasa el nivel", async ({ page }) => {
  // Arranca con los niveles previos superados.
  await page.addInitScript(() => {
    const done = Object.fromEntries(
      [
        "bedroom-00-recreate-01",
        "bedroom-00-recreate-02",
        "bedroom-00-recreate-03",
        "bedroom-00-recreate-04",
        "bedroom-00-recreate-05",
        "bedroom-01-recreate-06",
      ].map((id) => [id, 1]),
    );
    localStorage.setItem("offbeat.results.v1", JSON.stringify(done));
  });
  await page.goto("/");
  await page.getByTestId("start").click();
  await page.getByTestId("level-bedroom-01-fix-07").click();

  const energy = page.locator(".meter__fill");
  const before = await energy.evaluate((el) => Number.parseFloat((el as HTMLElement).style.width));
  await page.getByTestId("swing").fill("0.56");
  await expect
    .poll(async () => energy.evaluate((el) => Number.parseFloat((el as HTMLElement).style.width)))
    .toBeGreaterThan(before);

  await page.getByTestId("drop").click();
  await expect(page.getByTestId("result")).toContainText("100%");
  await expect(page.getByTestId("result")).toContainText("Pasaste");
});
