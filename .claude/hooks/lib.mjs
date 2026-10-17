import { relative } from "node:path";

export const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();

/** Lee el JSON que Claude Code manda por stdin a cada hook. */
export async function readInput() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

/** Ruta relativa a la raíz del repo, con barras normales. */
export function repoPath(file) {
  return relative(ROOT, file ?? "")
    .split("\\")
    .join("/");
}

/** Bloquea la acción: el código 2 hace que Claude Code le devuelva este mensaje a Claude. */
export function block(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

/** Texto nuevo que introduce una edición (Write, Edit o MultiEdit). */
export function newText(toolInput) {
  if (typeof toolInput.content === "string") return toolInput.content;
  if (typeof toolInput.new_string === "string") return toolInput.new_string;
  if (Array.isArray(toolInput.edits)) return toolInput.edits.map((e) => e.new_string ?? "").join("\n");
  return "";
}
