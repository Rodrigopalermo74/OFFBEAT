import { expect, type Page, test } from "@playwright/test";
import { questionSequence } from "../packages/game-core/src/keyShift.ts";

// Con ?seed=N las preguntas salen de la misma secuencia que calcula game-core, así el test sabe las respuestas.
const SEED = 7;

async function startWith(page: Page, done: string[]) {
  await page.addInitScript((ids) => {
    localStorage.setItem("offbeat.results.v1", JSON.stringify(Object.fromEntries(ids.map((id) => [id, 1]))));
  }, done);
  await page.goto(`/?seed=${SEED}`);
  await page.getByTestId("start").click();
}

test("Find the Root: responder todos los grados con el teclado pasa el nivel", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await startWith(page, []);
  await page.getByTestId("level-warehouse-03-find-the-root-01").click();
  await page.keyboard.press("Space");

  const questions = questionSequence(["1", "5"], 6, SEED);
  for (const [i, q] of questions.entries()) {
    await expect(page.getByTestId("round")).toContainText(`Ronda ${i + 1} de 6`);
    await page.keyboard.press(q);
    await expect(page.getByTestId("feedback")).toContainText("✓");
    if (i < questions.length - 1) await page.keyboard.press("Enter");
  }

  await expect(page.getByTestId("result")).toContainText("100%");
  await expect(page.getByTestId("next")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Find the Root: una respuesta equivocada muestra la correcta", async ({ page }) => {
  await startWith(page, []);
  await page.getByTestId("level-warehouse-03-find-the-root-01").click();

  const [first] = questionSequence(["1", "5"], 6, SEED);
  const wrong = first === "1" ? "5" : "1";
  await page.getByTestId(`answer-${wrong}`).click();
  await expect(page.getByTestId("feedback")).toContainText("✗ Era la");
  await expect(page.getByTestId(`answer-${first}`)).toHaveClass(/is-right/);
  await expect(page.getByTestId(`answer-${wrong}`)).toHaveClass(/is-wrong/);
});

test("Mode Swap: dice qué grado cambió y se desbloquea después de Find the Root", async ({ page }) => {
  const roots = [1, 2, 3, 4, 5].map((n) => `warehouse-03-find-the-root-0${n}`);
  await startWith(page, roots);
  await page.getByTestId("level-label-06-mode-swap-06").click();

  const questions = questionSequence(["dorian", "phrygian"], 6, SEED);
  for (const [i, q] of questions.entries()) {
    await page.getByTestId(`answer-${q}`).click();
    await expect(page.getByTestId("feedback")).toContainText(
      q === "dorian" ? "la 6ª pasó de F a F#" : "la 2ª pasó de B a Bb",
    );
    if (i < questions.length - 1) await page.getByTestId("advance").click();
  }
  await expect(page.getByTestId("result")).toContainText("100%");
});
