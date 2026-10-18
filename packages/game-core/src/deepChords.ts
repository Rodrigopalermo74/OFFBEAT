import { chordTones, fromMidi, pitchClass, voiceLeadingCost } from "@offbeat/theory";

export interface BarAnalysis {
  /** El compás tiene exactamente las notas del acorde, una por voz, dentro del rango. */
  valid: boolean;
  /** Notas del acorde que faltan (con la ortografía del acorde). */
  missing: string[];
  /** Notas que no pertenecen al acorde, repetidas o fuera de rango. */
  extra: string[];
}

/** Revisa un compás: ¿estas notas MIDI forman el acorde pedido, sin duplicar, dentro de [low, high]? */
export function analyzeBar(notes: number[], symbol: string, low: number, high: number): BarAnalysis {
  const tones = chordTones(symbol);
  const seen = new Set<number>();
  const extra: string[] = [];
  for (const midi of [...notes].sort((a, b) => a - b)) {
    const pc = pitchClass(midi);
    const inChord = tones.some((t) => t.pc === pc);
    if (!inChord || seen.has(pc) || midi < low || midi > high) extra.push(fromMidi(midi));
    else seen.add(pc);
  }
  const missing = tones.filter((t) => !seen.has(t.pc)).map((t) => t.name);
  return { valid: missing.length === 0 && extra.length === 0, missing, extra };
}

/** Stack the Chord: 1 si el acorde está completo y limpio; si no, la fracción de aciertos sobre lo pedido + lo sobrante. */
export function scoreStack(notes: number[], symbol: string, low: number, high: number): number {
  const { missing, extra } = analyzeBar(notes, symbol, low, high);
  const size = chordTones(symbol).length;
  const hits = size - missing.length;
  return hits / (size + extra.length);
}

export interface VoiceLeadingResult {
  score: number;
  /** Semitonos movidos en total entre compases consecutivos (null si algún compás no es válido). */
  cost: number | null;
  bars: BarAnalysis[];
}

/**
 * Voice Leading: todos los compases deben ser el acorde correcto; después se compara
 * el movimiento total contra el óptimo. Mover 0 semitonos de más vale 1.
 */
export function scoreVoiceLeading(
  bars: number[][],
  symbols: string[],
  optimalCost: number,
  low: number,
  high: number,
): VoiceLeadingResult {
  const analyses = symbols.map((symbol, i) => analyzeBar(bars[i] ?? [], symbol, low, high));
  const validCount = analyses.filter((a) => a.valid).length;
  if (validCount < symbols.length) {
    // Sin acordes correctos no hay voice leading que medir: crédito parcial por compás correcto.
    return { score: (0.5 * validCount) / symbols.length, cost: null, bars: analyses };
  }
  let cost = 0;
  for (let i = 1; i < bars.length; i++) cost += voiceLeadingCost(bars[i - 1] ?? [], bars[i] ?? []);
  // Cada semitono de más pesa menos cuanto más larga es la progresión.
  const score = Math.min(1, (optimalCost + 2) / (cost + 2));
  return { score, cost, bars: analyses };
}
