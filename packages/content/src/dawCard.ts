/** Una tarjeta "Hacelo en tu DAW" (formato en .claude/skills/tarjeta-daw). */
export interface DawCard {
  title: string;
  concept: string;
  chapter: number;
  intro: string;
  daws: { name: string; steps: string[] }[];
  challenge: string;
}

export const DAWS = ["Ableton Live", "FL Studio", "Logic Pro", "Bitwig Studio"] as const;

/** Lee el Markdown de una tarjeta. Tira un error con el problema si el formato no cierra. */
export function parseDawCard(markdown: string): DawCard {
  const lines = markdown.split(/\r?\n/).map((l) => l.trim());
  const title = lines.find((l) => l.startsWith("# "))?.slice(2);
  if (!title) throw new Error("Falta el título (# ...)");
  const meta = lines.find((l) => l.startsWith("Concepto:"))?.match(/^Concepto:\s*(\S+)\s*·\s*Capítulo:\s*(\d+)/);
  if (!meta) throw new Error("Falta la línea 'Concepto: <id>  ·  Capítulo: <n>'");
  const firstDaw = lines.findIndex((l) => l.startsWith("## "));
  const intro = lines
    .slice(lines.indexOf(meta[0] as string) + 1, firstDaw)
    .filter(Boolean)
    .join(" ");
  const daws: DawCard["daws"] = [];
  let challenge = "";
  for (const line of lines.slice(firstDaw)) {
    if (line.startsWith("## ")) daws.push({ name: line.slice(3), steps: [] });
    else if (/^\d+\.\s/.test(line)) daws.at(-1)?.steps.push(line.replace(/^\d+\.\s/, ""));
    else if (line.startsWith("Reto:")) challenge = line.slice(5).trim();
  }
  const names = daws.map((d) => d.name);
  if (names.join("|") !== DAWS.join("|")) throw new Error(`Los DAW tienen que ser ${DAWS.join(", ")} en ese orden`);
  for (const d of daws) {
    if (d.steps.length < 1 || d.steps.length > 5)
      throw new Error(`${d.name}: entre 1 y 5 pasos (tiene ${d.steps.length})`);
  }
  if (!intro) throw new Error("Falta la oración de qué vas a escuchar");
  if (!challenge) throw new Error("Falta el Reto");
  return { title, concept: meta[1] as string, chapter: Number(meta[2]), intro, daws, challenge };
}
