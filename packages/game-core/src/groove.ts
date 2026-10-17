/** Un golpe de un patrón: paso (con fracción para microtiming) y velocity 0–1. */
export interface Hit {
  voice: string;
  time: number; // en segundos desde el inicio del compás
  velocity: number;
}

export interface GrooveScoreOptions {
  /** Ventana de tolerancia temporal en ms: error ≥ ventana suma 0 puntos. */
  windowMs: number;
  /** Peso de la velocity en la nota final (0–1). */
  velocityWeight?: number;
}

export interface GrooveScore {
  /** 0–1: precisión total. */
  score: number;
  matched: number;
  missed: number;
  extra: number;
  meanTimingErrorMs: number;
}

/**
 * Compara una interpretación contra un patrón de referencia.
 * Cada golpe de referencia se empareja con el golpe tocado más cercano de la misma voz dentro de la ventana.
 */
export function scoreGroove(reference: Hit[], played: Hit[], options: GrooveScoreOptions): GrooveScore {
  const windowS = options.windowMs / 1000;
  const vw = options.velocityWeight ?? 0.25;
  const used = new Set<number>();
  let total = 0;
  let matched = 0;
  let timingErrorSum = 0;

  for (const ref of reference) {
    let bestIndex = -1;
    let bestDelta = Number.POSITIVE_INFINITY;
    played.forEach((hit, i) => {
      if (used.has(i) || hit.voice !== ref.voice) return;
      const delta = Math.abs(hit.time - ref.time);
      if (delta < windowS && delta < bestDelta) {
        bestDelta = delta;
        bestIndex = i;
      }
    });
    if (bestIndex === -1) continue;
    used.add(bestIndex);
    matched++;
    timingErrorSum += bestDelta;
    const timing = 1 - bestDelta / windowS;
    const velocity = 1 - Math.abs((played[bestIndex] as Hit).velocity - ref.velocity);
    total += (1 - vw) * timing + vw * velocity;
  }

  const extra = played.length - used.size;
  const denominator = reference.length + extra;
  return {
    score: denominator === 0 ? 1 : total / denominator,
    matched,
    missed: reference.length - matched,
    extra,
    meanTimingErrorMs: matched ? (timingErrorSum / matched) * 1000 : 0,
  };
}

/**
 * Tiempo en segundos de un paso de 1/16 con swing estilo MPC.
 * swing = 0.5 es recto; 0.66 ≈ tresillo. Solo se desplazan los pasos impares (las "e" del 1/16).
 */
export function stepTime(step: number, bpm: number, swing = 0.5): number {
  const sixteenth = 60 / bpm / 4;
  const pair = Math.floor(step / 2);
  const offset = step % 2 === 1 ? 2 * sixteenth * swing : 0;
  return pair * 2 * sixteenth + offset;
}
