import { pitchClass } from "@offbeat/theory";

export interface BassNote {
  midi: number;
  start: number;
}

export interface BasslineAnalysis {
  /** Notas del objetivo que el jugador puso en el paso y la altura justos. */
  hits: number;
  /** Notas del objetivo que no tienen respuesta exacta. */
  missed: BassNote[];
  /** Notas del jugador que no coinciden con ninguna del objetivo. */
  extra: BassNote[];
  /** De las que sobran: misma nota y mismo paso que una del objetivo, pero en otra octava. */
  wrongOctave: number;
  /** De las que sobran: en el paso de una nota del objetivo, pero con otra nota. */
  wrongNote: number;
}

const key = (n: BassNote) => `${n.start}:${n.midi}`;

/** Compara la respuesta con la llamada: importa en qué paso empieza cada nota y su altura; la duración no. */
export function analyzeBassline(target: readonly BassNote[], played: readonly BassNote[]): BasslineAnalysis {
  const wanted = new Set(target.map(key));
  const got = new Set(played.map(key));
  const missed = target.filter((n) => !got.has(key(n)));
  const extra = played.filter((n) => !wanted.has(key(n)));
  let wrongOctave = 0;
  let wrongNote = 0;
  for (const n of extra) {
    const sameStep = missed.find((m) => m.start === n.start);
    if (!sameStep) continue;
    if (pitchClass(sameStep.midi) === pitchClass(n.midi)) wrongOctave++;
    else wrongNote++;
  }
  return { hits: target.length - missed.length, missed, extra, wrongOctave, wrongNote };
}

/** Aciertos sobre (notas del objetivo + notas que sobran): poner notas de más no sale gratis. */
export function scoreBassline(target: readonly BassNote[], played: readonly BassNote[]): number {
  if (target.length === 0) return 0;
  const { hits, extra } = analyzeBassline(target, played);
  return hits / (target.length + extra.length);
}
