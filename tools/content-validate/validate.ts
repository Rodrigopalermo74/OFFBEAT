// Uso: pnpm content:validate [archivo.json ...]  (sin argumentos valida todo packages/content/levels)
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { checkLevel } from "./check.ts";

const LEVELS_DIR = "packages/content/levels";
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
if (failed) {
  console.error(`\n${failed} nivel(es) con errores`);
  process.exit(1);
}
