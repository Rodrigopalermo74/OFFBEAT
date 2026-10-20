import { expect, type Page, test } from "@playwright/test";

const CHAPTER_4 = [
  "club-04-stack-01",
  "club-04-stack-02",
  "club-04-stack-03",
  "club-04-voice-leading-04",
  "club-04-voice-leading-05",
  "club-04-voice-leading-06",
];

async function startWith(page: Page, done: string[]) {
  await page.addInitScript((ids) => {
    localStorage.setItem("offbeat.results.v1", JSON.stringify(Object.fromEntries(ids.map((id) => [id, 1]))));
  }, done);
  await page.goto("/");
  await page.getByTestId("start").click();
}

test("Mood Board: el vamp i9 → iv9 con el teclado pasa el nivel", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await startWith(page, CHAPTER_4);
  await page.getByTestId("level-club-05-mood-board-07").click();
  await page.keyboard.press("Space");

  await page.keyboard.press("1"); // Am9 en el compás 1
  await page.keyboard.press("4"); // Dm9 en el compás 2
  await expect(page.getByTestId("slot-0")).toContainText("i9 · Tónica");
  await expect(page.getByTestId("slot-1")).toContainText("iv9 · Predominante");
  await expect(page.getByTestId("checks").locator("li:not(.ok)")).toHaveCount(0);

  await page.keyboard.press("Enter");
  await expect(page.getByTestId("result")).toContainText("100%");
  expect(errors).toEqual([]);
});

test("Mood Board: el brief marca lo que falta y se corrige eligiendo el compás", async ({ page }) => {
  const levels = [7, 8, 9, 10].map((n) => `club-05-mood-board-${String(n).padStart(2, "0")}`);
  await startWith(page, [...CHAPTER_4, ...levels]);
  await page.getByTestId("level-club-05-mood-board-11").click();

  // Am9 Dm9 Fmaj7 Am9: termina en tónica, no en dominante.
  for (const chord of ["Am9", "Dm9", "Fmaj7", "Am9"]) await page.getByTestId(`pad-${chord}`).click();
  await page.getByTestId("drop").click();
  await expect(page.getByTestId("result")).not.toContainText("100%");
  await expect(page.getByTestId("checks").locator("li:not(.ok)")).toContainText(["Terminá en un dominante"]);

  await page.getByTestId("slot-3").click();
  await page.getByTestId("pad-Em7").click();
  await page.getByTestId("drop").click();
  await expect(page.getByTestId("result")).toContainText("100%");
});
