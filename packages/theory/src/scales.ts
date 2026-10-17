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
