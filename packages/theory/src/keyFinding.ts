/**
 * Detección de tonalidad por perfiles de Krumhansl–Kessler (algoritmo de Krumhansl–Schmuckler):
 * correlación entre el histograma de clases de altura (ponderado por duración) y los 24 perfiles.
 */
const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

export interface NoteEvent {
  midi: number;
  duration: number;
}

export interface KeyEstimate {
  tonic: string;
  mode: "major" | "minor";
  correlation: number;
}

export function estimateKey(notes: NoteEvent[]): KeyEstimate[] {
  const histogram = new Array<number>(12).fill(0);
  for (const n of notes) {
    const pc = ((n.midi % 12) + 12) % 12;
    histogram[pc] = (histogram[pc] ?? 0) + n.duration;
  }
  const results: KeyEstimate[] = [];
  for (let tonic = 0; tonic < 12; tonic++) {
    for (const [mode, profile] of [
      ["major", MAJOR],
      ["minor", MINOR],
    ] as const) {
      const rotated = histogram.map((_, i) => profile[(i - tonic + 12) % 12] as number);
      results.push({ tonic: NAMES[tonic] as string, mode, correlation: pearson(histogram, rotated) });
    }
  }
  return results.sort((a, b) => b.correlation - a.correlation);
}

function pearson(a: number[], b: number[]): number {
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const ma = mean(a);
  const mb = mean(b);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < a.length; i++) {
    const x = (a[i] as number) - ma;
    const y = (b[i] as number) - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  return da === 0 || db === 0 ? 0 : num / Math.sqrt(da * db);
}
