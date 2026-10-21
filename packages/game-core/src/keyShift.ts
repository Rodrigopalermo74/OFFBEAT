/**
 * Key Shift: rondas de oído. Las preguntas salen de una semilla para que una partida
 * se pueda repetir (y testear) igual.
 */

/** Generador pseudoaleatorio mulberry32: mismo `seed`, misma secuencia. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * `rounds` preguntas tomadas de `pool`, sin repetir la misma dos veces seguidas (si hay más de una opción)
 * y usando cada opción al menos una vez cuando alcanzan las rondas.
 */
export function questionSequence<T>(pool: readonly T[], rounds: number, seed: number): T[] {
  if (pool.length === 0) throw new Error("El pool de preguntas está vacío");
  const rand = mulberry32(seed);
  const pick = (options: readonly T[]) => options[Math.floor(rand() * options.length)] as T;
  const out: T[] = [];
  for (let i = 0; i < rounds; i++) {
    const unused = pool.filter((p) => !out.includes(p));
    const roundsLeft = rounds - i;
    let options = unused.length > 0 && unused.length >= roundsLeft ? unused : pool;
    if (options.length > 1) options = options.filter((p) => p !== out.at(-1));
    out.push(pick(options));
  }
  return out;
}

/** Proporción de aciertos sobre el total de rondas del nivel (las no respondidas cuentan como error). */
export function scoreQuiz(answers: readonly boolean[], rounds: number): number {
  if (rounds <= 0) return 0;
  return answers.filter(Boolean).length / rounds;
}

/** Mejor racha de aciertos seguidos. */
export function bestStreak(answers: readonly boolean[]): number {
  let best = 0;
  let run = 0;
  for (const ok of answers) {
    run = ok ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}
