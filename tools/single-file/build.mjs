// Uso: pnpm build:single [salida.html]
// Arma OFFBEAT en un solo HTML (JS, CSS y fuentes adentro) para el link jugable.
// Sale sin doctype ni <html>/<body>: el visor del link agrega ese esqueleto.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

const out = resolve(process.argv[2] ?? "dist-single/offbeat.html");
const tmp = mkdtempSync(join(tmpdir(), "offbeat-single-"));
const build = spawnSync(
  "pnpm",
  ["--filter", "@offbeat/web", "exec", "vite", "build", "--base", "./", "--outDir", tmp, "--emptyOutDir"],
  {
    stdio: "inherit",
  },
);
if (build.status !== 0) process.exit(build.status ?? 1);

const assets = join(tmp, "assets");
const files = readdirSync(assets);
const read = (ext) => readFileSync(join(assets, files.find((f) => f.endsWith(ext)) ?? ""), "utf8");
const js = read(".js").replace(/<\/script/g, "<\\/script");
// Solo latin y latin-ext: el resto de los subsets no se usa y suma peso.
const css = read(".css").replace(/@font-face\{[^}]*?url\(\.?\/?([^)]+?\.woff2)\)[^}]*\}/g, (block, file) => {
  if (!/-(latin|latin-ext)-/.test(file)) return "";
  const data = readFileSync(join(assets, basename(file))).toString("base64");
  return block.replace(/url\([^)]+\.woff2\)/, `url(data:font/woff2;base64,${data})`);
});

spawnSync("mkdir", ["-p", resolve(out, "..")]);
writeFileSync(
  out,
  `<title>OFFBEAT</title><meta name="theme-color" content="#0c0b0a"><style>${css}</style><div id="root"></div><script type="module">${js}</script>`,
);
rmSync(tmp, { recursive: true, force: true });

const kb = Math.round(statSync(out).size / 1024);
console.log(`\n${out} · ${kb} KB`);
// Presupuesto: el link carga todo de una; si crece mucho, revisá qué entró al bundle.
if (kb > 1536) {
  console.error(`El archivo pesa ${kb} KB y el presupuesto es 1536 KB.`);
  process.exit(1);
}
