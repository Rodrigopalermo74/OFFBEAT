import { type DeepChordsTarget, type GrooveLabTarget, Level } from "../../packages/content/src/schema.ts";
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
    const target = level.target as DeepChordsTarget;
    const voicings: number[][] = [];
    for (const symbol of target.progression) {
      try {
        voicings.push(chordVoicing(symbol));
      } catch {
        errors.push(`target.progression: acorde inválido "${symbol}"`);
      }
    }
    const [low, high] = target.voicingRange.map(toMidi) as [number, number];
    if (low >= high) errors.push("target.voicingRange: el rango está invertido");
    if (level.mode === "stack" && target.progression.length !== 1) {
      errors.push("target.progression: stack pide un solo acorde");
    }
    if (level.mode === "voice-leading") {
      if (target.progression.length < 2) errors.push("target.progression: voice-leading necesita al menos dos acordes");
      if (new Set(voicings.map((v) => v.length)).size > 1) {
        errors.push("target.progression: todos los acordes deben tener la misma cantidad de voces");
      }
      if (errors.length === 0) {
        const cost = optimalProgressionCost(voicings, low, high);
        if (cost !== target.optimalCost) {
          errors.push(`target.optimalCost: declarado ${target.optimalCost ?? "nada"}, calculado ${cost}`);
        }
      }
    }
    if (level.mode !== "stack" && level.mode !== "voice-leading") {
      errors.push(`mode: "${level.mode}" no existe en deep-chords (stack o voice-leading)`);
    }
  }

  if (level.game === "groove-lab") {
    const target = level.target as GrooveLabTarget;
    const lengthErrors = (tracks: GrooveLabTarget["tracks"], where: string) => {
      for (const [voice, steps] of Object.entries(tracks)) {
        if (steps && steps.length !== target.steps) {
          errors.push(`${where}.${voice}: tiene ${steps.length} pasos, se esperaban ${target.steps}`);
        }
      }
    };
    lengthErrors(target.tracks, "target.tracks");
    if (level.mode === "recreate" && target.start) {
      errors.push("target.start: en recreate el jugador arranca con el grid vacío");
    }
    if (level.mode === "fix") {
      if (!target.start) {
        errors.push("target.start: fix necesita un punto de partida");
      } else {
        lengthErrors(target.start.tracks, "target.start.tracks");
        const voices = new Set([...Object.keys(target.tracks), ...Object.keys(target.start.tracks)]);
        for (const voice of voices) {
          const want = target.tracks[voice as keyof typeof target.tracks] ?? [];
          const has = target.start.tracks[voice as keyof typeof target.start.tracks] ?? [];
          if (want.some((v, i) => v > 0 !== (has[i] ?? 0) > 0)) {
            errors.push(
              `target.start.tracks.${voice}: en fix los golpes deben coincidir con el objetivo; solo cambia el feel`,
            );
          }
        }
      }
    }
    if (level.mode !== "recreate" && level.mode !== "fix") {
      errors.push(`mode: "${level.mode}" no existe en groove-lab (recreate o fix)`);
    }
  }

  return errors;
}
