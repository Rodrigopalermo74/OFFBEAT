import { Scale } from "tonal";
import { pitchClass, toMidi } from "./notes.ts";

/** Clases de altura (0–11) de una escala: scalePitchClasses("A", "dorian") → [9, 11, 0, 2, 4, 6, 7]. */
export function scalePitchClasses(tonic: string, mode: string): number[] {
  const scale = Scale.get(`${tonic} ${mode}`);
  if (scale.empty) throw new Error(`Escala inválida: ${tonic} ${mode}`);
  return scale.notes.map((n) => pitchClass(toMidi(`${n}4`)));
}

export function inScale(midi: number, pitchClasses: number[]): boolean {
  return pitchClasses.includes(pitchClass(midi));
}

/** Grado relativo a la escala mayor, por semitonos desde la tónica: 3 → "♭3", 9 → "6". */
const DEGREE_LABELS = ["1", "♭2", "2", "♭3", "3", "4", "♯4", "5", "♭6", "6", "♭7", "7"];

export interface ScaleDegree {
  /** 1–7. */
  degree: number;
  /** Nombre de la nota tal como se escribe en la escala ("F#", "Bb"). */
  name: string;
  pc: number;
  /** Semitonos desde la tónica (0–11). */
  semitones: number;
  /** Grado comparado con la escala mayor ("♭3", "6"). */
  label: string;
}

/** Los siete grados de una escala: scaleDegrees("A", "minor")[2] → { degree: 3, name: "C", label: "♭3", … }. */
export function scaleDegrees(tonic: string, mode: string): ScaleDegree[] {
  const scale = Scale.get(`${tonic} ${mode}`);
  if (scale.empty || scale.notes.length !== 7) throw new Error(`Escala de 7 notas inválida: ${tonic} ${mode}`);
  const root = pitchClass(toMidi(`${tonic}4`));
  return scale.notes.map((name, i) => {
    const pc = pitchClass(toMidi(`${name}4`));
    const semitones = (pc - root + 12) % 12;
    return { degree: i + 1, name, pc, semitones, label: DEGREE_LABELS[semitones] as string };
  });
}

/** MIDI de un grado (1–8, el 8 es la tónica una octava arriba) con la tónica en la octava dada. */
export function degreeMidi(tonic: string, mode: string, degree: number, octave = 4): number {
  const degrees = scaleDegrees(tonic, mode);
  const base = toMidi(`${tonic}${octave}`);
  const octaves = Math.floor((degree - 1) / 7);
  const step = degrees[(degree - 1) % 7] as ScaleDegree;
  return base + 12 * octaves + step.semitones;
}

export interface DegreeChange {
  degree: number;
  from: ScaleDegree;
  to: ScaleDegree;
}

/** Grados que cambian al pasar de un modo a otro sobre la misma tónica: A eólico → A dórico cambia la 6ª (F → F#). */
export function modeDiff(tonic: string, from: string, to: string): DegreeChange[] {
  const a = scaleDegrees(tonic, from);
  const b = scaleDegrees(tonic, to);
  return a.flatMap((d, i) => {
    const other = b[i] as ScaleDegree;
    return d.semitones === other.semitones ? [] : [{ degree: d.degree, from: d, to: other }];
  });
}
