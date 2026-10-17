/**
 * Costo de voice leading entre dos acordes de igual cantidad de voces:
 * mínima suma de semitonos movidos, sobre todas las asignaciones voz→voz.
 * Fuerza bruta de permutaciones: suficiente para ≤ 6 voces (720 casos).
 */
export function voiceLeadingCost(from: number[], to: number[]): number {
  if (from.length !== to.length) {
    throw new Error("Los acordes deben tener la misma cantidad de voces");
  }
  let best = Number.POSITIVE_INFINITY;
  for (const perm of permutations(to)) {
    let cost = 0;
    for (let i = 0; i < from.length; i++) cost += Math.abs((from[i] as number) - (perm[i] as number));
    if (cost < best) best = cost;
  }
  return best;
}

/** Todas las inversiones/voicings de un conjunto de clases de altura dentro de [low, high]. */
export function voicingsInRange(pitchClasses: number[], low: number, high: number): number[][] {
  const options = pitchClasses.map((pc) => {
    const notes: number[] = [];
    for (let m = low; m <= high; m++) if (((m % 12) + 12) % 12 === pc) notes.push(m);
    return notes;
  });
  const result: number[][] = [];
  const walk = (i: number, acc: number[]) => {
    if (i === options.length) {
      result.push([...acc].sort((a, b) => a - b));
      return;
    }
    for (const n of options[i] as number[]) {
      if (!acc.includes(n)) walk(i + 1, [...acc, n]);
    }
  };
  walk(0, []);
  return result;
}

/**
 * Costo óptimo de una progresión: elige un voicing por acorde dentro del rango
 * minimizando el movimiento total (programación dinámica sobre los voicings).
 */
export function optimalProgressionCost(chords: number[][], low: number, high: number): number {
  const candidates = chords.map((c) => voicingsInRange([...new Set(c.map((m) => ((m % 12) + 12) % 12))], low, high));
  let prev = (candidates[0] ?? []).map(() => 0);
  for (let i = 1; i < candidates.length; i++) {
    const before = candidates[i - 1] as number[][];
    const current = candidates[i] as number[][];
    prev = current.map((v) => Math.min(...before.map((u, j) => (prev[j] as number) + voiceLeadingCost(u, v))));
  }
  return prev.length ? Math.min(...prev) : 0;
}

function* permutations<T>(items: T[]): Generator<T[]> {
  if (items.length <= 1) {
    yield [...items];
    return;
  }
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const perm of permutations(rest)) yield [items[i] as T, ...perm];
  }
}
