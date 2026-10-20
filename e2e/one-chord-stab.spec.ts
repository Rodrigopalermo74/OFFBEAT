import { expect, type Page, test } from "@playwright/test";

const BEFORE = [
  ...[1, 2, 3].map((n) => `club-04-stack-0${n}`),
  ...[4, 5, 6].map((n) => `club-04-voice-leading-0${n}`),
  ...[7, 8, 9, 10, 11].map((n) => `club-05-mood-board-${String(n).padStart(2, "0")}`),
];

async function startWith(page: Page, done: string[]) {
  await page.addInitScript((ids) => {
    localStorage.setItem("offbeat.results.v1", JSON.stringify(Object.fromEntries(ids.map((id) => [id, 1]))));
  }, done);
  await page.goto("/");
  await page.getByTestId("start").click();
}

test("One-Chord Stab: mover el Am7 en paralelo pasa el primer nivel", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await startWith(page, BEFORE);
  await page.getByTestId("level-label-06-one-chord-stab-12").click();
  await page.keyboard.press("Space");

  for (const root of ["A", "C", "D", "C"]) await page.getByTestId(`root-${root}`).click();
  await expect(page.getByTestId("slot-1")).toContainText("Cm7");
  await expect(page.getByTestId("slot-1")).toContainText("Fuera de la escala: Eb Bb");
  await expect(page.getByTestId("slot-0")).toContainText("Todo dentro de la escala");

  await page.keyboard.press("Enter");
  await expect(page.getByTestId("result")).toContainText("100%");
  expect(errors).toEqual([]);
});

test("One-Chord Stab: paralelo o diatónico, con flechas y la tecla P", async ({ page }) => {
  await startWith(page, [...BEFORE, "label-06-one-chord-stab-12", "label-06-one-chord-stab-13"]);
  await page.getByTestId("level-label-06-one-chord-stab-14").click();

  await page.getByTestId("root-A").click();
  await page.getByTestId("root-F").click();
  await page.getByTestId("root-D").click();
  await page.keyboard.press("ArrowUp"); // compás 4 vacío: arranca en la tónica (A)
  await page.keyboard.press("ArrowUp"); // A → Bb en paralelo
  await expect(page.getByTestId("slot-3")).toContainText("Bbm9");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByTestId("compare")).toContainText("Paralelo: Fm9");
  await expect(page.getByTestId("compare")).toContainText("Diatónico: Fmaj9");

  await page.keyboard.press("Enter");
  await expect(page.getByTestId("summary")).toContainText("el movimiento no es ese");

  await page.keyboard.press("p");
  await expect(page.getByTestId("root-Bb")).toBeDisabled();
  await expect(page.getByTestId("slot-3")).toContainText("Am9"); // Bb bajó al grado de abajo
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowUp"); // A → B → C saltea Bb: en diatónico se mueve por grados
  await page.keyboard.press("ArrowUp");
  await expect(page.getByTestId("slot-3")).toContainText("Cmaj9");
  await expect(page.getByTestId("slot-1")).toContainText("Fmaj9");

  await page.keyboard.press("Enter");
  await expect(page.getByTestId("result")).toContainText("100%");
});
