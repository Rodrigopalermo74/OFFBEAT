import { type MidiSong, writeMidi, zipStore } from "@offbeat/midi";

/** Lo mínimo que usamos del runtime de los artifacts de Claude (solo existe cuando la app corre ahí). */
interface DownloadsNamespace {
  save(request: { filename: string; data: Uint8Array }): Promise<{ status: string }>;
}
interface ClaudeRuntime {
  use(name: "downloads"): Promise<DownloadsNamespace | null>;
}

export type ExportResult = "saved" | "declined" | "failed";

/**
 * Guarda la canción como .mid. En el navegador baja el archivo directo; dentro de un
 * artifact de Claude (que solo deja bajar ciertos formatos) va como .zip con el .mid adentro.
 */
export async function saveMidi(name: string, song: MidiSong): Promise<ExportResult> {
  const mid = writeMidi(song);
  const runtime = (window as unknown as { claude?: ClaudeRuntime }).claude;
  if (runtime?.use) {
    const downloads = await runtime.use("downloads");
    if (!downloads) return "failed";
    try {
      await downloads.save({ filename: `${name}.zip`, data: zipStore([{ name: `${name}.mid`, data: mid }]) });
      return "saved";
    } catch (error) {
      return (error as { code?: string }).code === "declined" ? "declined" : "failed";
    }
  }
  const url = URL.createObjectURL(new Blob([mid as BlobPart], { type: "audio/midi" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.mid`;
  link.click();
  URL.revokeObjectURL(url);
  return "saved";
}

/** Corre una nota de batería según el swing (los 1/16 impares se atrasan), en pasos con fracción. */
export function swungStart(step: number, swing: number): number {
  return step % 2 === 1 ? step + (swing - 0.5) * 2 : step;
}

/** Notas de General MIDI para cada voz de batería (canal 10). */
export const GM_DRUMS: Record<string, number> = { kick: 36, rim: 37, clap: 39, closedHat: 42, openHat: 46 };
