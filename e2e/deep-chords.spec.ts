import { expect, type Page, test } from "@playwright/test";

// Geometría del piano roll: teclado de 36 px a la izquierda, filas de C3 (48) a C5 (72), 16 pasos por compás.
const KEY_WIDTH = 36;
const LOW = 48;
const HIGH = 72;

async function clickNote(page: Page, midi: number, bar: number, bars: number) {
  const box = await page.getByTestId("piano-roll").boundingBox();
  if (!box) throw new Error("No se encontró el piano roll");
  const rowH = box.height / (HIGH - LOW + 1);
  const barW = (box.width - KEY_WIDTH) / bars;
  await page.mouse.click(box.x + KEY_WIDTH + (bar + 0.5) * barW, box.y + (HIGH - midi + 0.5) * rowH);
}

async function startWith(page: Page, done: string[]) {
  await page.addInitScript((ids) => {
    localStorage.setItem("offbeat.results.v1", JSON.stringify(Object.fromEntries(ids.map((id) => [id, 1]))));
  }, done);
  await page.goto("/");
  await page.getByTestId("start").click();
}

test("Stack the Chord: apilar un Am7 pasa el primer nivel", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await startWith(page, []);
  await page.getByTestId("level-club-04-stack-01").click();

  await expect(page.getByTestId("bar-0")).toContainText("Falta: A, C, E, G");
  for (const midi of [57, 60, 64]) await clickNote(page, midi, 0, 1); // A3 C4 E4
  await expect(page.getByTestId("bar-0")).toContainText("Falta: G");
  await clickNote(page, 61, 0, 1); // C#4, no pertenece
  await expect(page.getByTestId("bar-0")).toContainText("Sobra: C#4");
  await clickNote(page, 61, 0, 1); // quitarla
  await clickNote(page, 67, 0, 1); // G4

  await expect(page.getByTestId("bar-0")).toContainText("✓");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("result")).toContainText("100%");
  await expect(page.getByTestId("next")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Voice Leading: dejar quietas las notas en común llega a la meta", async ({ page }) => {
  await startWith(page, ["club-04-stack-01", "club-04-stack-02", "club-04-stack-03"]);
  await page.getByTestId("level-club-04-voice-leading-04").click();

  // Arranca en posición fundamental: Am7 (A3 C4 E4 G4) → Dm7 (D3 F3 A3 C4), 28 semitonos.
  await expect(page.getByTestId("movement")).toContainText("Movimiento: 28 semitonos · Meta: 4");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("result")).not.toContainText("100%");

  // Dm7 como A3 C4 D4 F4: quedan quietas A y C, E baja a D y G baja a F.
  await clickNote(page, 50, 1, 2);
  await clickNote(page, 53, 1, 2);
  await clickNote(page, 62, 1, 2);
  await clickNote(page, 65, 1, 2);
  await expect(page.getByTestId("movement")).toContainText("Movimiento: 4 semitonos");

  await page.getByTestId("drop").click();
  await expect(page.getByTestId("result")).toContainText("100%");
});

test("el mapa separa los recorridos de cada minijuego", async ({ page }) => {
  await startWith(page, []);
  await expect(page.getByTestId("level-bedroom-00-recreate-01")).toBeEnabled();
  await expect(page.getByTestId("level-club-04-stack-01")).toBeEnabled();
  await expect(page.getByTestId("level-club-04-stack-02")).toBeDisabled();
});
