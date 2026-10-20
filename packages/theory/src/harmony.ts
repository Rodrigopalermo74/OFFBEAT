import { Chord } from "tonal";
import { pitchClass, toMidi } from "./notes.ts";
import { scaleDegrees } from "./scales.ts";
import { voiceLeadingCost, voicingsInRange } from "./voiceLeading.ts";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

/** Grado (1–7) de la fundamental del acorde en la escala, o null si cae fuera: chordDegree("Dm9", "A", "minor") → 4. */
export function chordDegree(symbol: string, tonic: string, mode: string): number | null {
  const chord = Chord.get(symbol);
  if (chord.empty || !chord.tonic) throw new Error(`Acorde inválido: ${symbol}`);
  const root = pitchClass(toMidi(`${chord.tonic}4`));
  const index = scaleDegrees(tonic, mode).findIndex((d) => d.pc === root);
  return index === -1 ? null : index + 1;
}

/**
 * Cifrado romano relativo a la escala, minúscula para acordes menores:
 * romanNumeral("Am9", "A", "minor") → "i9", romanNumeral("Fmaj7", "A", "minor") → "VImaj7".
 */
export function romanNumeral(symbol: string, tonic: string, mode: string): string | null {
  const degree = chordDegree(symbol, tonic, mode);
  if (degree === null) return null;
  const chord = Chord.get(symbol);
  const numeral = ROMAN[degree - 1] as string;
  const suffix = symbol.slice((chord.tonic as string).length);
  if (suffix.startsWith("m7b5")) return `${numeral.toLowerCase()}ø${suffix.slice(4) || "7"}`;
  if (suffix.startsWith("dim")) return `${numeral.toLowerCase()}°${suffix.slice(3)}`;
  if (chord.quality === "Minor") return `${numeral.toLowerCase()}${suffix.replace(/^m(?!aj)/, "")}`;
  return `${numeral}${suffix}`;
}

/**
 * Voicing del acorde dentro de [low, high] que menos se mueve desde `prev`
 * (o el más centrado en el rango si no hay acorde anterior). Sirve para que una
 * progresión armada con pads suene ligada, como la tocaría un tecladista.
 */
export function smoothVoicing(prev: number[] | null, symbol: string, low: number, high: number): number[] {
  const chord = Chord.get(symbol);
  if (chord.empty) throw new Error(`Acorde inválido: ${symbol}`);
  const pcs = [...new Set(chord.notes.map((n) => pitchClass(toMidi(`${n}4`))))];
  const candidates = voicingsInRange(pcs, low, high);
  if (candidates.length === 0) throw new Error(`${symbol} no entra en el rango`);
  const center = (low + high) / 2;
  const spread = (v: number[]) => Math.abs(v.reduce((s, m) => s + m, 0) / v.length - center);
  const cost = (v: number[]) => {
    if (!prev) return 0;
    if (prev.length === v.length) return voiceLeadingCost(prev, v);
    return v.reduce((s, m) => s + Math.min(...prev.map((p) => Math.abs(p - m))), 0);
  };
  let best = candidates[0] as number[];
  for (const v of candidates) {
    const d = cost(v) - cost(best) || spread(v) - spread(best);
    if (d < 0) best = v;
  }
  return best;
}
