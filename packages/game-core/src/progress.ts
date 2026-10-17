export interface LevelRef {
  id: string;
  chapter: number;
  threshold: number;
}

/** Mejor puntaje por nivel (0–1). */
export type Results = Record<string, number>;

/**
 * Mastery gating: un nivel se desbloquea cuando el anterior (en orden de juego)
 * superó su umbral. El primero siempre está disponible.
 */
export function unlockedLevels(levels: LevelRef[], results: Results): Set<string> {
  const ordered = sortLevels(levels);
  const unlocked = new Set<string>();
  for (const [i, level] of ordered.entries()) {
    const prev = ordered[i - 1];
    if (!prev || (results[prev.id] ?? 0) >= prev.threshold) unlocked.add(level.id);
    else break;
  }
  return unlocked;
}

/** Orden de juego: por capítulo y después por el número final del id ("...-recreate-06" → 6). */
export function sortLevels<T extends LevelRef>(levels: T[]): T[] {
  const index = (id: string) => Number(id.match(/-(\d+)$/)?.[1] ?? Number.POSITIVE_INFINITY);
  return [...levels].sort((a, b) => a.chapter - b.chapter || index(a.id) - index(b.id) || a.id.localeCompare(b.id));
}

/** Guarda el mejor puntaje sin pisar uno mayor. */
export function recordResult(results: Results, id: string, score: number): Results {
  return score > (results[id] ?? 0) ? { ...results, [id]: score } : results;
}
