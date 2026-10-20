// Uso: pnpm content:validate [archivo.json ...]  (sin argumentos valida todo packages/content/levels)
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parseDawCard } from "../../packages/content/src/dawCard.ts";
import { checkLevel } from "./check.ts";

const LEVELS_DIR = "packages/content/levels";
const CARDS_DIR = "packages/content/daw-cards";
const files = process.argv.slice(2).filter((f) => f.endsWith(".json"));
const targets = files.length
  ? files
  : readdirSync(LEVELS_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => join(LEVELS_DIR, f));

let failed = 0;
for (const file of targets) {
  let errors: string[];
  try {
    const data = JSON.parse(readFileSync(file, "utf8"));
    errors = checkLevel(data);
    if (!errors.length && data.id !== basename(file, ".json")) {
      errors.push(`id "${data.id}" no coincide con el nombre del archivo`);
    }
    if (data.dawCard && !existsSync(join(CARDS_DIR, `${data.dawCard}.md`))) {
      errors.push(`dawCard: no existe ${CARDS_DIR}/${data.dawCard}.md`);
    }
  } catch (e) {
    errors = [`JSON ilegible: ${(e as Error).message}`];
  }
  if (errors.length) {
    failed++;
    console.error(`✗ ${file}\n  ${errors.join("\n  ")}`);
  } else {
    console.log(`✓ ${file}`);
  }
}
for (const card of readdirSync(CARDS_DIR).filter((f) => f.endsWith(".md"))) {
  try {
    parseDawCard(readFileSync(join(CARDS_DIR, card), "utf8"));
    console.log(`✓ ${CARDS_DIR}/${card}`);
  } catch (e) {
    failed++;
    console.error(`✗ ${CARDS_DIR}/${card}\n  ${(e as Error).message}`);
  }
}
if (failed) {
  console.error(`\n${failed} archivo(s) con errores`);
  process.exit(1);
}
