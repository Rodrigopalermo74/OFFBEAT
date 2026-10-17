import { Note } from "tonal";

/** Número MIDI de una nota con octava ("C4" → 60). Lanza si el nombre no es válido. */
export function toMidi(name: string): number {
  const midi = Note.midi(name);
  if (midi === null) throw new Error(`Nota inválida: ${name}`);
  return midi;
}

/** Nombre de una nota MIDI, con sostenidos o bemoles (60 → "C4"). */
export function fromMidi(midi: number, preferFlats = false): string {
  return preferFlats ? Note.fromMidi(midi) : Note.fromMidiSharps(midi);
}

/** Clase de altura 0–11 (C = 0). */
export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}
