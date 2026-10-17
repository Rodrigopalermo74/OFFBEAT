// Stop: antes de que Claude dé el trabajo por terminado, typecheck y tests de lo que cambió.
import { spawnSync } from "node:child_process";
import { block, ROOT, readInput } from "./lib.mjs";

const { stop_hook_active: alreadyContinuing } = await readInput();
// Si ya estamos en una vuelta forzada por este hook, no insistir (evita loops infinitos).
if (alreadyContinuing) process.exit(0);

const run = (cmd, args) => spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8" });

const status = run("git", ["status", "--porcelain", "--untracked-files=all"]).stdout ?? "";
const changed = status
  .split("\n")
  .map((line) => line.slice(3).trim())
  .filter((f) => /\.(ts|tsx)$/.test(f) && !f.startsWith("e2e/"));
if (changed.length === 0) process.exit(0);

const tail = (s) => s.split("\n").slice(-40).join("\n");

const typecheck = run("pnpm", ["typecheck"]);
if (typecheck.status !== 0) {
  block(`El typecheck falla. Corregilo antes de terminar:\n${tail(typecheck.stdout + typecheck.stderr)}`);
}

const tests = run("pnpm", ["exec", "vitest", "related", "--run", "--passWithNoTests", ...changed]);
if (tests.status !== 0) {
  block(
    `Hay tests rotos relacionados con tus cambios. Corregilos antes de terminar:\n${tail(tests.stdout + tests.stderr)}`,
  );
}
