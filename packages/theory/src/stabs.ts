import { detectChord } from "./chords.ts";
import { fromMidi, pitchClass, toMidi } from "./notes.ts";
import { scalePitchClasses } from "./scales.ts";

/** Formas de stab típicas de Detroit y deep tech. */
export const STAB_SHAPES = ["m7", "m9", "m11", "7sus4"] as const;
export type StabShape = (typeof STAB_SHAPES)[number];

/**
 * paralelo: la misma forma se transpone entera (aparecen notas fuera de la escala).
 * diatónico: cada nota se queda en la escala, así que la calidad del acorde cambia según el grado.
 */
export type StabMotion = "parallel" | "diatonic";

interface ShapeDef {
  /** Semitonos desde la fundamental (movimiento paralelo). */
  semitones: number[];
  /** Pasos de escala desde la fundamental (movimiento diatónico): 2 = tercera, 4 = quinta, 6 = séptima… */
  steps: number[];
}

const SHAPES: Record<StabShape, ShapeDef> = {
  m7: { semitones: [0, 3, 7, 10], steps: [0, 2, 4, 6] },
  m9: { semitones: [0, 3, 7, 10, 14], steps: [0, 2, 4, 6, 8] },
  // Voicing abierto clásico del m11: 1, 5, ♭7, ♭3 arriba y 11.
  m11: { semitones: [0, 7, 10, 15, 17], steps: [0, 4, 6, 9, 10] },
  "7sus4": { semitones: [0, 5, 7, 10], steps: [0, 3, 4, 6] },
};

/** Fundamental del stab en la octava 3 (C3–B3), para que todas las formas entren en la zona media. */
export function stabRootMidi(root: string): number {
  return toMidi(`${root}3`);
}

/**
 * Notas de un stab. En diatónico la fundamental tiene que estar en la escala de `tonic mode`.
 * stabNotes(57, "m7", "parallel", "A", "minor") → A3 C4 E4 G4
 * stabNotes(48, "m7", "diatonic", "A", "minor") → C3 E3 G3 B3 (Cmaj7: la forma se adapta a la escala)
 */
export function stabNotes(
  rootMidi: number,
  shape: StabShape,
  motion: StabMotion,
  tonic: string,
  mode: string,
): number[] {
  const def = SHAPES[shape];
  if (motion === "parallel") return def.semitones.map((s) => rootMidi + s);
  const scale = scalePitchClasses(tonic, mode);
  const index = scale.indexOf(pitchClass(rootMidi));
  if (index === -1) throw new Error(`${fromMidi(rootMidi)} no está en ${tonic} ${mode}`);
  return def.steps.map((step) => {
    const pc = scale[(index + step) % scale.length] as number;
    return rootMidi + ((pc - pitchClass(rootMidi) + 12) % 12) + 12 * Math.floor(step / scale.length);
  });
}

/** Nombre del acorde que suena: en paralelo es la forma sobre la fundamental; en diatónico se detecta. */
export function stabName(rootMidi: number, shape: StabShape, motion: StabMotion, tonic: string, mode: string): string {
  const root = fromMidi(rootMidi, true).replace(/-?\d+$/, "");
  if (motion === "parallel") return `${root}${shape}`;
  const notes = stabNotes(rootMidi, shape, motion, tonic, mode);
  return detectChord(notes).find((name) => !name.includes("/")) ?? root;
}
