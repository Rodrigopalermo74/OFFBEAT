import type { NoteClip } from "@offbeat/audio-engine";
import { degreeMidi } from "@offbeat/theory";

const BAR = 16;

/** Tríada de la tónica del modo (1, 3, 5) en la octava 3, sostenida. */
export function droneClip(tonic: string, mode: string, start: number, length: number): NoteClip[] {
  return [1, 3, 5].map((degree) => ({ midi: degreeMidi(tonic, mode, degree, 3), start, length }));
}

/** Find the Root: un compás con el drone y la nota del grado preguntado dos veces, una octava arriba. */
export function rootClip(tonic: string, mode: string, degree: number): NoteClip[] {
  const midi = degreeMidi(tonic, mode, degree, 4);
  return [...droneClip(tonic, mode, 0, BAR), { midi, start: 0, length: 6 }, { midi, start: 8, length: 6 }];
}

/** Dos compases en un modo: escala subiendo de 1 a 8 en corcheas y bajando de 8 a 1. */
function modePhrase(tonic: string, mode: string, start: number): NoteClip[] {
  const run = [1, 2, 3, 4, 5, 6, 7, 8, 8, 7, 6, 5, 4, 3, 2, 1];
  return [
    ...droneClip(tonic, mode, start, 2 * BAR),
    ...run.map((degree, i) => ({ midi: degreeMidi(tonic, mode, degree, 4), start: start + 2 * i, length: 2 })),
  ];
}

/** Mode Swap: dos compases en el modo de casa y dos en el modo nuevo, misma tónica (64 pasos). */
export function swapClip(tonic: string, home: string, mode: string): { home: NoteClip[]; swap: NoteClip[] } {
  return { home: modePhrase(tonic, home, 0), swap: modePhrase(tonic, mode, 2 * BAR) };
}
