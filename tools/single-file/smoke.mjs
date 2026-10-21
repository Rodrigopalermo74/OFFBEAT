// Uso: pnpm smoke:single [archivo.html]
// Abre el HTML de un solo archivo, arranca, entra a un nivel de cada juego y falla si hay errores o faltan las fuentes.
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const file = resolve(process.argv[2] ?? "dist-single/offbeat.html");
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(`file://${file}`);
await page.getByTestId("start").click();
for (const n of ["1", "2", "3", "4"]) {
  await page.getByTestId("track-groove-lab").waitFor();
  await page.keyboard.press(n);
  await page.locator(".level-title").waitFor();
  await page.keyboard.press("Escape");
}
const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family));
await browser.close();

for (const family of ["Archivo Variable", "JetBrains Mono Variable"]) {
  if (!fonts.includes(family)) errors.push(`No cargó la fuente ${family}`);
}
if (errors.length) {
  console.error(`✗ ${file}\n  ${errors.join("\n  ")}`);
  process.exit(1);
}
console.log(`✓ ${file}: arranca, abre un nivel por juego y carga las fuentes`);
