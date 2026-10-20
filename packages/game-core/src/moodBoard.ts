import { chordDegree } from "@offbeat/theory";

/** Función armónica simplificada: tónica, predominante, dominante. */
export type HarmonicFunction = "T" | "PD" | "D";

/** Funciones por grado de la escala (en menor, el VII suena a dominante: VII → i). */
const FUNCTION_BY_DEGREE: Record<number, HarmonicFunction> = {
  1: "T",
  2: "PD",
  3: "T",
  4: "PD",
  5: "D",
  6: "PD",
  7: "D",
};

/** Cuánto pide resolver cada función (para el medidor de tensión). */
export const TENSION: Record<HarmonicFunction, number> = { T: 0, PD: 1, D: 2 };

export type MoodCheck =
  | { type: "complete" }
  | { type: "start"; fn: HarmonicFunction }
  | { type: "end"; fn: HarmonicFunction }
  | { type: "includes"; chord: string }
  | { type: "cadence"; from: HarmonicFunction; to: HarmonicFunction }
  | { type: "distinct"; min: number }
  | { type: "no-repeat" };

export interface Key {
  tonic: string;
  mode: string;
}

export function harmonicFunction(symbol: string, key: Key): HarmonicFunction | null {
  const degree = chordDegree(symbol, key.tonic, key.mode);
  return degree === null ? null : (FUNCTION_BY_DEGREE[degree] ?? null);
}

/** ¿La progresión (un acorde por compás, null = compás vacío) cumple este requisito del brief? */
export function passesCheck(progression: readonly (string | null)[], key: Key, check: MoodCheck): boolean {
  const filled = progression.filter((c): c is string => c !== null);
  const complete = filled.length === progression.length && progression.length > 0;
  const fn = (c: string | null | undefined) => (c ? harmonicFunction(c, key) : null);
  switch (check.type) {
    case "complete":
      return complete;
    case "start":
      return fn(progression[0]) === check.fn;
    case "end":
      return complete && fn(progression.at(-1)) === check.fn;
    case "includes":
      return filled.includes(check.chord);
    case "cadence": {
      // El loop vuelve a empezar: el último compás también resuelve en el primero.
      const n = progression.length;
      for (let i = 0; i < n; i++) {
        const next = i + 1 < n ? progression[i + 1] : complete ? progression[0] : null;
        if (fn(progression[i]) === check.from && fn(next) === check.to) return true;
      }
      return false;
    }
    case "distinct":
      return new Set(filled).size >= check.min;
    case "no-repeat":
      return complete && progression.every((c, i) => c !== progression[(i + 1) % progression.length]);
  }
}

/** Mood Board: proporción de requisitos cumplidos; completar todos los compases siempre es uno de ellos. */
export function evaluateMoodBoard(progression: readonly (string | null)[], key: Key, checks: readonly MoodCheck[]) {
  const all: MoodCheck[] = [{ type: "complete" }, ...checks];
  const results = all.map((check) => ({ check, ok: passesCheck(progression, key, check) }));
  return { results, score: results.filter((r) => r.ok).length / results.length };
}
