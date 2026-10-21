// PreToolUse (Bash): frena comandos destructivos antes de que corran.
import { block, readInput } from "./lib.mjs";

const { tool_input: input = {} } = await readInput();
const cmd = String(input.command ?? "");

const rules = [
  [
    /\brm\s+-[a-zA-Z]*r[a-zA-Z]*\s+(\.\/)?(assets|packages|apps|\.git)(\/?\s|\/?$)/,
    "No borres carpetas del repo con rm -rf; si hace falta, usá git rm y explicá por qué.",
  ],
  [
    /\bgit\s+push\b.*(--force(?!-with-lease)\b|\s-f\b)/,
    "No hagas push --force. Usá --force-with-lease y solo en tu propia rama.",
  ],
  [/\bgit\s+push\b.*\s(origin\s+)?(main|master)(\s|$)/, "No pushees directo a main: trabajá en una rama y abrí un PR."],
  [
    /\bgit\s+reset\s+--hard\s+origin\/(main|master)\b/,
    "No descartes trabajo con reset --hard sobre main sin confirmación del usuario.",
  ],
  [
    /\bpkill\s+-f\s+["']?vite\b/,
    "pkill -f vite también mata la shell que lo lanzó. Para liberar el puerto usá: fuser -k 5173/tcp",
  ],
];

for (const [pattern, reason] of rules) {
  if (pattern.test(cmd)) block(`Bloqueado: ${reason}`);
}
