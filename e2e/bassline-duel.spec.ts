import { expect, type Page, test } from "@playwright/test";

// Geometría del piano roll: teclado de 36 px, filas de E1 (28) a A3 (57), 16 pasos.
const KEY_WIDTH = 36;
const LOW = 28;
const HIGH = 57;
const A1 = 33;
const A2 = 45;

async function clickNote(page: Page, midi: number, step: number) {
  const box = await page.getByTestId("piano-roll").boundingBox();
  if (!box) throw new Error("No se encontró el piano roll");
  const rowH = box.height / (HIGH - LOW + 1);
  const stepW = (box.width - KEY_WIDTH) / 16;
  await page.mouse.click(box.x + KEY_WIDTH + (step + 0.5) * stepW, box.y + (HIGH - midi + 0.5) * rowH);
}

async function startWith(page: Page, done: string[]) {
  await page.addInitScript((ids) => {
    localStorage.setItem("offbeat.results.v1", JSON.stringify(Object.fromEntries(ids.map((id) => [id, 1]))));
  }, done);
  await page.goto("/");
  await page.getByTestId("start").click();
}

test("Bassline Duel: copiar el bajo en el offbeat pasa el primer nivel", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await startWith(page, []);
  await page.getByTestId("level-warehouse-02-call-response-01").click();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("duel-state")).toContainText("▶");

  for (const step of [2, 6, 10, 14]) await clickNote(page, A1, step);
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("result")).toContainText("100%");
  await expect(page.getByTestId("next")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Bassline Duel: avisa cuando la nota está en la octava equivocada", async ({ page }) => {
  await startWith(page, ["warehouse-02-call-response-01"]);
  await page.getByTestId("level-warehouse-02-call-response-02").click();

  // La llamada es A1 A2 A1 A2; respondemos todo en A1.
  for (const step of [2, 6, 10, 14]) await clickNote(page, A1, step);
  await page.getByTestId("drop").click();
  await expect(page.getByTestId("summary")).toContainText("Acertaste 2 de 4 · 2 en la octava equivocada");

  // Una nota nueva en el mismo paso reemplaza a la anterior (el bajo es monofónico).
  await clickNote(page, A2, 6);
  await clickNote(page, A2, 14);
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("result")).toContainText("100%");
});
