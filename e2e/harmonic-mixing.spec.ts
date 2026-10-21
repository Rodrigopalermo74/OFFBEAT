import { expect, type Page, test } from "@playwright/test";
import { mixingRounds } from "../packages/game-core/src/harmonicMixing.ts";
import { type MixKey, mixKeyName } from "../packages/theory/src/index.ts";

// Con ?seed=N las rondas salen de la misma secuencia que calcula game-core, así el test sabe las respuestas.
const SEED = 7;
const am: MixKey = { tonic: "A", mode: "minor" };
const KEY_SHIFT = [
  ...[1, 2, 3, 4, 5].map((n) => `warehouse-03-find-the-root-0${n}`),
  ...[6, 7, 8].map((n) => `label-06-mode-swap-0${n}`),
];

async function startWith(page: Page, done: string[]) {
  await page.addInitScript((ids) => {
    localStorage.setItem("offbeat.results.v1", JSON.stringify(Object.fromEntries(ids.map((id) => [id, 1]))));
  }, done);
  await page.goto(`/?seed=${SEED}`);
  await page.getByTestId("start").click();
}

test("Harmonic Mixing: cargar el vecino en la cubierta B y mezclar con el teclado pasa el nivel", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await startWith(page, KEY_SHIFT);
  await page.getByTestId("level-label-07-harmonic-mixing-09").click();
  await expect(page.getByTestId("deck-a")).toContainText("8A");
  await page.keyboard.press("Space");

  const rounds = mixingRounds({ task: "pick", rounds: 6, homes: [am], relations: ["adjacent"], candidates: 3 }, SEED);
  for (const [i, r] of rounds.entries()) {
    if (r.task !== "pick") throw new Error("esperaba pick");
    await expect(page.getByTestId("round")).toContainText(`Ronda ${i + 1} de 6`);
    await page.keyboard.press(String(r.answer + 1));
    await expect(page.getByTestId("deck-b")).toContainText(mixKeyName(r.candidates[r.answer] as MixKey));
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("feedback")).toContainText("son vecinos en la rueda");
    await expect(page.getByTestId("scales")).toBeVisible();
    if (i < rounds.length - 1) await page.keyboard.press("Enter");
  }

  await expect(page.getByTestId("result")).toContainText("100%");
  await expect(page.getByTestId("next")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Harmonic Mixing: un candidato que choca se marca y muestra cuál mezclaba", async ({ page }) => {
  await startWith(page, KEY_SHIFT);
  await page.getByTestId("level-label-07-harmonic-mixing-09").click();
  const [first] = mixingRounds({ task: "pick", rounds: 6, homes: [am], relations: ["adjacent"], candidates: 3 }, SEED);
  if (first?.task !== "pick") throw new Error("esperaba pick");
  const wrong = first.answer === 0 ? 1 : 0;
  await page.getByTestId(`candidate-${wrong + 1}`).click();
  await page.getByTestId("mix").click();
  await expect(page.getByTestId("feedback")).toContainText("choca");
  await expect(page.getByTestId(`candidate-${first.answer + 1}`)).toHaveClass(/is-right/);
  await expect(page.getByTestId(`candidate-${wrong + 1}`)).toHaveClass(/is-wrong/);
});

test("Harmonic Mixing de oído: la cubierta B queda oculta hasta responder", async ({ page }) => {
  const done = [...KEY_SHIFT, "label-07-harmonic-mixing-09", "label-07-harmonic-mixing-10"];
  await startWith(page, done);
  await page.getByTestId("level-label-07-harmonic-mixing-11").click();
  const [first] = mixingRounds(
    { task: "ear", rounds: 8, homes: [am], relations: ["relative", "adjacent"], candidates: 2 },
    SEED,
  );
  if (first?.task !== "ear") throw new Error("esperaba ear");
  await expect(page.getByTestId("deck-b")).toContainText("??");
  await page.keyboard.press(first.compatible ? "1" : "2");
  await expect(page.getByTestId("feedback")).toContainText(first.compatible ? "✓ Funciona" : "✓ Choca");
  await expect(page.getByTestId("deck-b")).toContainText(mixKeyName(first.other));
});
