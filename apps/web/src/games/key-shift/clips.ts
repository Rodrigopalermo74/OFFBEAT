import type { NoteClip } from "@offbeat/audio-engine";
import { degreeMidi, type MixKey, type ScaleDegree, scaleDegrees } from "@offbeat/theory";

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

/**
 * Harmonic Mixing: dos compases de "track" en una tonalidad. La cubierta A es el acorde de séptima
 * de la tónica con un arpegio en corcheas; la cubierta B, su acorde una octava arriba y la escala
 * bajando en negras, así todas sus notas suenan contra la A y los roces se oyen.
 */
export function deckClip(key: MixKey, deck: "A" | "B", start: number): NoteClip[] {
  const { tonic, mode } = key;
  const octave = deck === "A" ? 3 : 4;
  const chord = [1, 3, 5, 7].map((d) => ({ midi: degreeMidi(tonic, mode, d, octave), start, length: 2 * BAR }));
  if (deck === "A") {
    const arp = [1, 3, 5, 7, 8, 7, 5, 3];
    return [
      ...chord,
      ...[...arp, ...arp].map((d, i) => ({ midi: degreeMidi(tonic, mode, d, 4), start: start + 2 * i, length: 2 })),
    ];
  }
  const run = [8, 7, 6, 5, 4, 3, 2, 1];
  return [...chord, ...run.map((d, i) => ({ midi: degreeMidi(tonic, mode, d, 5), start: start + 4 * i, length: 4 }))];
}

/** Bajo de la cubierta A: la tónica en negras con el offbeat, durante todo el loop. */
export function deckBass(key: MixKey, steps: number): NoteClip[] {
  const midi = degreeMidi(key.tonic, key.mode, 1, 2);
  return Array.from({ length: steps / 4 }, (_, i) => ({ midi, start: 4 * i + 2, length: 2 }));
}

/** El blend: dos compases solo con la cubierta A y dos con las dos juntas (64 pasos). */
export function blendClip(home: MixKey, other: MixKey | null): NoteClip[] {
  return [...deckClip(home, "A", 0), ...deckClip(home, "A", 2 * BAR), ...(other ? deckClip(other, "B", 2 * BAR) : [])];
}

/** Modulation Run: dos compases en una tonalidad con la tónica en `tonicMidi` (acorde de séptima y arpegio arriba). */
export function sectionClip(key: MixKey, tonicMidi: number, start: number): NoteClip[] {
  const degrees = scaleDegrees(key.tonic, key.mode);
  const at = (degree: number, octave = 0) =>
    tonicMidi + 12 * (octave + Math.floor((degree - 1) / 7)) + (degrees[(degree - 1) % 7] as ScaleDegree).semitones;
  const chord = [1, 3, 5, 7].map((d) => ({ midi: at(d), start, length: 2 * BAR }));
  const arp = [1, 3, 5, 8, 5, 3, 1, 3, 5, 7, 8, 5, 3, 2, 1, 5];
  return [...chord, ...arp.map((d, i) => ({ midi: at(d, 1), start: start + 2 * i, length: 2 }))];
}

/** Bajo de una sección: la tónica en el offbeat, dos octavas debajo del arpegio. */
export function sectionBass(tonicMidi: number, start: number): NoteClip[] {
  return Array.from({ length: 8 }, (_, i) => ({ midi: tonicMidi - 12, start: start + 4 * i + 2, length: 2 }));
}

/**
 * Altura de la tónica en cada tonalidad del run: sigue el movimiento de cada modulación (el tono sube,
 * el relativo menor → mayor sube una tercera menor) y se pliega por octavas para quedar entre E3 y D#4.
 */
export function runTonics(start: MixKey, semitones: readonly number[]): number[] {
  const fold = (m: number) => (m > 63 ? m - 12 : m < 52 ? m + 12 : m);
  const out = [fold(degreeMidi(start.tonic, start.mode, 1, 3))];
  for (const s of semitones) out.push(fold((out.at(-1) as number) + s));
  return out;
}
