// PreToolUse (Edit|Write|MultiEdit): reglas que no se pueden romper al escribir código o assets.
import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { block, newText, ROOT, readInput, repoPath } from "./lib.mjs";

const { tool_name: tool, tool_input: input = {} } = await readInput();
const file = repoPath(input.file_path);
const text = newText(input);

// 1. El audio nunca se temporiza con timers del event loop.
if (file.startsWith("packages/audio-engine/") && /\bset(Timeout|Interval)\s*\(/.test(text)) {
  block(
    "Bloqueado: no uses setTimeout/setInterval en packages/audio-engine. " +
      "Programá los eventos con el Transport (lookahead sobre AudioContext.currentTime) y usá el `time` que recibe el callback. " +
      "Ver CLAUDE.md > Reglas de arquitectura.",
  );
}

// 2. La UI no habla con Tone.js directamente: solo con la interfaz AudioEngine.
if (/^(apps|packages\/ui-grid)\//.test(file) && /from\s+["']tone["']/.test(text)) {
  block("Bloqueado: la UI no importa Tone.js. Usá la interfaz AudioEngine de @offbeat/audio-engine.");
}

// 3. Ningún sample sin licencia: cada pack en assets/samples/<pack>/ necesita LICENSE.md antes que el audio.
const sample = file.match(/^assets\/samples\/([^/]+)\//);
if (tool === "Write" && sample && basename(file) !== "LICENSE.md") {
  const license = join(ROOT, "assets/samples", sample[1], "LICENSE.md");
  if (!existsSync(license)) {
    block(
      `Bloqueado: el pack "${sample[1]}" no tiene LICENSE.md. Creá ${repoPath(license)} con origen, licencia (CC0, CC BY...) y atribución antes de agregar archivos.`,
    );
  }
}

// 4. Los packs procesados se generan con el pipeline, no a mano.
if (file.startsWith("assets/packs/")) {
  block("Bloqueado: assets/packs es salida generada. Editá assets/samples y corré el pipeline de samples.");
}

// 5. Los componentes no traen colores propios: todo sale de los tokens de styles.css (docs/identidad-visual.md).
if (/^apps\/web\/src\/.+\.tsx$/.test(file) && /#[0-9a-fA-F]{3,8}\b|\brgba?\(/.test(text)) {
  block(
    "Bloqueado: no pongas colores sueltos en componentes. Usá los tokens de apps/web/src/styles.css " +
      "(--venue, --ok, --ko, --warn, --fn-t…) o agregá uno nuevo ahí. Ver docs/identidad-visual.md.",
  );
}
