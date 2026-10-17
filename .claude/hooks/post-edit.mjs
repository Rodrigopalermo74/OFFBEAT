// PostToolUse (Edit|Write|MultiEdit): formatea el archivo tocado y valida el contenido didáctico.
import { spawnSync } from "node:child_process";
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
