import { Chord } from "tonal";
import { pitchClass, toMidi } from "./notes.ts";

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * Voicing apilado por terceras en posición fundamental, desde la tónica en la octava dada.
 * chordVoicing("Am9", 3) → [57, 60, 64, 67, 71] (A3 C4 E4 G4 B4)
 */
export function chordVoicing(symbol: string, octave = 3): number[] {
  const chord = Chord.get(symbol);
  if (chord.empty || !chord.tonic) throw new Error(`Acorde inválido: ${symbol}`);
  const voicing: number[] = [];
  for (const note of chord.notes) {
    const pc = pitchClass(toMidi(`${note}${octave}`));
    const prev = voicing.at(-1);
    if (prev === undefined) {
      voicing.push(toMidi(`${note}${octave}`));
      continue;
    }
    voicing.push(prev + (((pc - pitchClass(prev) + 11) % 12) + 1));
  }
  return voicing;
}

/** Nombres posibles para un conjunto de notas MIDI; la nota más grave se toma como bajo. */
export function detectChord(midiNotes: number[]): string[] {
  const sorted = [...midiNotes].sort((a, b) => a - b);
  const names = sorted.map((m) => SHARP_NAMES[pitchClass(m)] as string);
  return Chord.detect([...new Set(names)]);
}
