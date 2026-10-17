import { Level } from "../../packages/content/src/schema.ts";
import { chordVoicing, optimalProgressionCost, toMidi } from "../../packages/theory/src/index.ts";

/** Valida un nivel: esquema Zod + verificación musical. Devuelve la lista de errores (vacía si está bien). */
export function checkLevel(data: unknown): string[] {
  const parsed = Level.safeParse(data);
  if (!parsed.success) {
    return parsed.error.issues.map((i) => `${i.path.join(".") || "(raíz)"}: ${i.message}`);
  }
  const level = parsed.data;
  const errors: string[] = [];

  if (level.game === "deep-chords") {
    const target = level.target as { progression: string[]; voicingRange: [string, string]; optimalCost: number };
    const voicings: number[][] = [];
    for (const symbol of target.progression) {
      try {
        voicings.push(chordVoicing(symbol));
      } catch {
        errors.push(`target.progression: acorde inválido "${symbol}"`);
      }
    }
    if (errors.length === 0) {
      const [low, high] = target.voicingRange.map(toMidi) as [number, number];
      const cost = optimalProgressionCost(voicings, low, high);
      if (cost !== target.optimalCost) {
        errors.push(`target.optimalCost: declarado ${target.optimalCost}, calculado ${cost}`);
      }
    }
  }

  if (level.game === "groove-lab") {
    const target = level.target as { steps: number; tracks: Record<string, number[]> };
    for (const [voice, steps] of Object.entries(target.tracks)) {
      if (steps.length !== target.steps) {
        errors.push(`target.tracks.${voice}: tiene ${steps.length} pasos, se esperaban ${target.steps}`);
      }
    }
  }

  return errors;
}
