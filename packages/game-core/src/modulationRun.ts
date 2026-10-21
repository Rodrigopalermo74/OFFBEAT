/**
 * Key Shift · Modulation Run (arcade): un track que cambia de tonalidad varias veces seguidas.
 * En cada cambio el jugador dice qué modulación fue; los aciertos seguidos suben el combo.
 */
import { type MixKey, type Modulation, modulate } from "@offbeat/theory";
import { mulberry32 } from "./keyShift.ts";

export interface RunStep {
  from: MixKey;
  to: MixKey;
  move: Modulation;
}

/** Combo máximo: a partir del cuarto acierto seguido cada uno vale ×4. */
export const MAX_COMBO = 4;

/**
 * `changes` modulaciones desde `start`, tomadas de `moves` de forma pareja, sin repetir la misma
 * dos veces seguidas (con más de una opción). Determinista por semilla.
 */
export function modulationRun(start: MixKey, moves: readonly Modulation[], changes: number, seed: number): RunStep[] {
  if (moves.length === 0) throw new Error("No hay modulaciones para elegir");
  const rand = mulberry32(seed);
  const steps: RunStep[] = [];
  let from = start;
  for (let i = 0; i < changes; i++) {
    const counts = moves.map((m) => steps.filter((s) => s.move === m).length);
    const least = Math.min(...counts);
    let options = moves.filter((_, j) => counts[j] === least);
    if (moves.length > 1) {
      const fresh = options.filter((m) => m !== steps.at(-1)?.move);
      options = fresh.length > 0 ? fresh : moves.filter((m) => m !== steps.at(-1)?.move);
    }
    const move = options[Math.floor(rand() * options.length)] as Modulation;
    const to = modulate(from, move);
    steps.push({ from, to, move });
    from = to;
  }
  return steps;
}

/** Combo en cada respuesta: aciertos seguidos hasta ese punto (0 si falló), con tope `MAX_COMBO`. */
export function comboTrail(answers: readonly boolean[]): number[] {
  let run = 0;
  return answers.map((ok) => {
    run = ok ? run + 1 : 0;
    return Math.min(run, MAX_COMBO);
  });
}

/** Puntos con combo sobre el máximo posible (todas bien): 0–1. Las no respondidas cuentan como error. */
export function scoreRun(answers: readonly boolean[], changes: number): number {
  if (changes <= 0) return 0;
  const max = comboTrail(Array.from({ length: changes }, () => true)).reduce((a, b) => a + b, 0);
  return comboTrail(answers).reduce((a, b) => a + b, 0) / max;
}
