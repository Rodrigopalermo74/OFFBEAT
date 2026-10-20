import { type StabMotion, type StabShape, stabNotes, stabRootMidi } from "@offbeat/theory";
import type { Key } from "./moodBoard.ts";

/** Un stab de varios compases: una forma, un tipo de movimiento y una fundamental por compás. */
export interface StabTake {
  shape: StabShape;
  motion: StabMotion;
  roots: (string | null)[];
}

export interface StabAnalysis {
  /** Promedio por compás de notas compartidas sobre notas totales (Jaccard). */
  score: number;
  shapeOk: boolean;
  motionOk: boolean;
  /** Fundamental correcta en cada compás (sin importar la octava). */
  rootsOk: boolean[];
}

/** Notas MIDI de cada compás; un compás vacío o imposible (fundamental fuera de escala en diatónico) queda vacío. */
export function stabBars(take: StabTake, key: Key): number[][] {
  return take.roots.map((root) => {
    if (!root) return [];
    try {
      return stabNotes(stabRootMidi(root), take.shape, take.motion, key.tonic, key.mode);
    } catch {
      return [];
    }
  });
}

function jaccard(a: number[], b: number[]): number {
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 1;
  const shared = a.filter((m) => b.includes(m)).length;
  return shared / union.size;
}

/** Compara el stab del jugador con el objetivo, compás por compás, por las notas que suenan. */
export function analyzeStab(target: StabTake, played: StabTake, key: Key): StabAnalysis {
  const want = stabBars(target, key);
  const got = stabBars(played, key);
  const score = want.reduce((sum, notes, i) => sum + jaccard(notes, got[i] ?? []), 0) / Math.max(want.length, 1);
  return {
    score,
    shapeOk: target.shape === played.shape,
    motionOk: target.motion === played.motion,
    rootsOk: target.roots.map((root, i) => {
      const mine = played.roots[i];
      return !!root && !!mine && stabRootMidi(root) % 12 === stabRootMidi(mine) % 12;
    }),
  };
}
