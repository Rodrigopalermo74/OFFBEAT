// PostToolUse (Edit|Write|MultiEdit): formatea el archivo tocado y valida el contenido didáctico.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { block, ROOT, readInput, repoPath } from "./lib.mjs";

const { tool_input: input = {} } = await readInput();
const file = repoPath(input.file_path);
if (!file || file.startsWith("..")) process.exit(0);

const run = (cmd, args) => spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8" });

// Formato y fixes seguros de Biome (silencioso si el archivo no aplica).
if (/\.(ts|tsx|mjs|js|json|css)$/.test(file)) {
  run("pnpm", ["exec", "biome", "check", "--write", "--no-errors-on-unmatched", file]);
}

// Un nivel con teoría incorrecta no sobrevive a la edición.
if (/^packages\/content\/levels\/.+\.json$/.test(file)) {
  const result = run("node", ["--experimental-strip-types", "tools/content-validate/validate.ts", file]);
  if (result.status !== 0) {
    block(`content:validate falló para ${file}:\n${result.stderr || result.stdout}\nCorregí el nivel antes de seguir.`);
  }
}

// Las tarjetas "Hacelo en tu DAW" se parsean al guardarlas, igual que los niveles.
if (/^packages\/content\/daw-cards\/.+\.md$/.test(file)) {
  const check = `import { readFileSync } from "node:fs"; import { parseDawCard } from "./packages/content/src/dawCard.ts"; parseDawCard(readFileSync(${JSON.stringify(file)}, "utf8"));`;
  const result = run("node", ["--experimental-strip-types", "--input-type=module", "-e", check]);
  if (result.status !== 0) {
    const reason = (result.stderr || result.stdout).split("\n").find((l) => l.startsWith("Error")) ?? result.stderr;
    block(`La tarjeta ${file} no respeta el formato de tarjeta-daw:\n${reason}`);
  }
}

// La UI habla en español rioplatense: avisá si se coló texto de interfaz en inglés.
if (/^apps\/web\/src\/.+\.tsx$/.test(file)) {
  const english =
    /(>|["'`])\s*(Tap to|Click here|Loading|Settings|Try again|Play again|Back to|Next level|Well done|Score:|Start game)\b/;
  const match = readFileSync(join(ROOT, file), "utf8").match(english);
  if (match) {
    block(
      `Texto de UI en inglés en ${file}: "${match[2]}". La interfaz va en español rioplatense; ` +
        "en inglés solo quedan los términos de producción (swing, groove, stab, drop).",
    );
  }
}
