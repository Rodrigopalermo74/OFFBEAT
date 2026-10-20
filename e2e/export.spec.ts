import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

test("Exportar MIDI: el groove del jugador baja como .mid con la batería en el canal 10", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("start").click();
  await page.getByTestId("level-bedroom-00-recreate-01").click();
  await expect(page.getByTestId("export-midi")).toBeDisabled();

  for (const step of [0, 4, 8, 12]) await page.getByTestId(`step-kick-${step}`).click();
  const download = page.waitForEvent("download");
  await page.keyboard.press("m");
  const file = await download;
  expect(file.suggestedFilename()).toBe("bedroom-00-recreate-01.mid");

  const bytes = readFileSync(await file.path());
  expect(bytes.subarray(0, 4).toString("latin1")).toBe("MThd");
  // Cuatro note on de kick (nota 36) en el canal 10 (0x99).
  const noteOns = [...bytes].filter((b, i) => b === 0x99 && bytes[i + 1] === 36);
  expect(noteOns).toHaveLength(4);
  await expect(page.getByTestId("export-status")).toContainText("arrastralo a tu DAW");
});

test("Hacelo en tu DAW: la tarjeta se abre con D y recuerda el DAW elegido", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("start").click();
  await page.getByTestId("level-bedroom-00-recreate-01").click();

  const card = page.getByTestId("daw-card");
  await expect(card).not.toHaveAttribute("open");
  await page.keyboard.press("d");
  await expect(card).toHaveAttribute("open");
  await card.getByRole("tab", { name: "Logic Pro" }).click();
  await expect(card).toContainText("Drum Machine Designer");

  await page.keyboard.press("Escape");
  await page.getByTestId("level-club-04-stack-01").click();
  await page.keyboard.press("d");
  await expect(page.getByTestId("daw-card").getByRole("tab", { name: "Logic Pro" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});
