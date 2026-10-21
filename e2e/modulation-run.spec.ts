import { expect, type Page, test } from "@playwright/test";
import { modulationRun } from "../packages/game-core/src/modulationRun.ts";
import { type MixKey, mixKeyName } from "../packages/theory/src/index.ts";

// Con ?seed=N el run sale de la misma secuencia que calcula game-core, así el test sabe las respuestas.
const SEED = 7;
const am: MixKey = { tonic: "A", mode: "minor" };
const BEFORE = [
  ...[1, 2, 3, 4, 5].map((n) => `warehouse-03-find-the-root-0${n}`),
  ...[6, 7, 8].map((n) => `label-06-mode-swap-0${n}`),
  ...[9, 10, 11, 12].map((n) => `label-07-harmonic-mixing-${String(n).padStart(2, "0")}`),
];

async function startWith(page: Page, done: string[]) {
  await page.addInitScript((ids) => {
    localStorage.setItem("offbeat.results.v1", JSON.stringify(Object.fromEntries(ids.map((id) => [id, 1]))));
  }, done);
  await page.goto(`/?seed=${SEED}`);
  await page.getByTestId("start").click();
}

test("Modulation Run: acertar todas las modulaciones con el teclado sube el combo y pasa el nivel", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await startWith(page, BEFORE);
  await page.getByTestId("level-label-07-modulation-run-13").click();
  await page.keyboard.press("Space");

  const moves = ["relative", "parallel"] as const;
  const run = modulationRun(am, moves, 6, SEED);
  for (const [i, step] of run.entries()) {
    await expect(page.getByTestId("round")).toContainText(`Cambio ${i + 1} de 6`);
    await page.keyboard.press(String(moves.indexOf(step.move as (typeof moves)[number]) + 1));
    await expect(page.getByTestId("feedback")).toContainText("✓");
    await expect(page.getByTestId("route")).toContainText(mixKeyName(step.to));
    await expect(page.getByTestId("combo")).toContainText(`×${Math.min(i + 1, 4)}`);
    if (i < run.length - 1) await page.keyboard.press("Enter");
  }

  await expect(page.getByTestId("result")).toContainText("100%");
  await expect(page.getByTestId("next")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Modulation Run: un error corta el combo y explica qué cambió", async ({ page }) => {
  await startWith(page, BEFORE);
  await page.getByTestId("level-label-07-modulation-run-13").click();
  const [first] = modulationRun(am, ["relative", "parallel"], 6, SEED);
  if (!first) throw new Error("run vacío");
  const wrong = first.move === "relative" ? "parallel" : "relative";
  await page.getByTestId(`answer-${wrong}`).click();
  await expect(page.getByTestId("feedback")).toContainText("✗ Era");
  await expect(page.getByTestId("feedback")).toContainText(`Am → ${mixKeyName(first.to)}`);
  await expect(page.getByTestId("combo")).toContainText("×1");
  await expect(page.getByTestId(`answer-${first.move}`)).toHaveClass(/is-right/);
});
