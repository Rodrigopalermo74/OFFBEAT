import { type Hit, scoreGroove, stepTime } from "./groove.ts";

/** Patrón de grid: velocity 0–1 por paso de 1/16, por voz. */
export type Grid = Record<string, number[]>;

export interface GrooveTake {
  swing: number;
  tracks: Grid;
}

/** Convierte un grid en golpes con tiempo real (aplicando swing) para puntuarlo. */
export function gridToHits(tracks: Grid, bpm: number, swing: number): Hit[] {
  const hits: Hit[] = [];
  for (const [voice, steps] of Object.entries(tracks)) {
    steps.forEach((velocity, step) => {
      if (velocity > 0) hits.push({ voice, time: stepTime(step, bpm, swing), velocity });
    });
  }
  return hits;
}

/**
 * Recreate (dictado rítmico): solo importa qué pasos suenan, no la velocity.
 * 1 = patrón idéntico; cada golpe faltante o sobrante resta.
 */
export function scoreRecreate(target: Grid, played: Grid): number {
  let matched = 0;
  let expected = 0;
  let extra = 0;
  for (const voice of new Set([...Object.keys(target), ...Object.keys(played)])) {
    const t = target[voice] ?? [];
    const p = played[voice] ?? [];
    const length = Math.max(t.length, p.length);
    for (let i = 0; i < length; i++) {
      const want = (t[i] ?? 0) > 0;
      const has = (p[i] ?? 0) > 0;
      if (want) expected++;
      if (want && has) matched++;
      if (has && !want) extra++;
    }
  }
  const denominator = expected + extra;
  return denominator === 0 ? 1 : matched / denominator;
}

/**
 * Fix the Groove: los golpes ya están; se puntúa el feel.
 * timing: golpes reales (con swing) contra el objetivo, en una ventana chica.
 * dinámica: error medio de velocity, normalizado al rango útil (ghost 0.4 → fuerte 1).
 * El puntaje es el producto: hay que acertar las dos cosas.
 */
export function scoreFix(target: GrooveTake, played: GrooveTake, bpm: number, windowMs = 20): number {
  const timing = scoreGroove(
    gridToHits(target.tracks, bpm, target.swing),
    gridToHits(played.tracks, bpm, played.swing),
    { windowMs, velocityWeight: 0 },
  ).score;

  let error = 0;
  let count = 0;
  for (const [voice, steps] of Object.entries(target.tracks)) {
    steps.forEach((want, step) => {
      if (want <= 0) return;
      error += Math.abs(want - (played.tracks[voice]?.[step] ?? 0));
      count++;
    });
  }
  const dynamics = count === 0 ? 1 : Math.max(0, 1 - error / count / 0.6);
  return timing * dynamics;
}
