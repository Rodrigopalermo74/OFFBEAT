/** Estado de la pista según la energía (0–1). */
export type CrowdMood = "vacia" | "calentando" | "arriba" | "explota";

export function crowdMood(energy: number): CrowdMood {
  if (energy >= 0.95) return "explota";
  if (energy >= 0.75) return "arriba";
  if (energy >= 0.4) return "calentando";
  return "vacia";
}

/** Suavizado exponencial: la pista reacciona de a poco, no salta con cada cambio. */
export function nextEnergy(current: number, score: number, smoothing = 0.35): number {
  const clamped = Math.min(1, Math.max(0, score));
  return current + (clamped - current) * smoothing;
}

/** Estrellas de un resultado: 1 al pasar el umbral, 2 a mitad de camino a la perfección, 3 casi perfecto. */
export function stars(score: number, threshold: number): 0 | 1 | 2 | 3 {
  if (score < threshold) return 0;
  if (score >= 0.98) return 3;
  if (score >= threshold + (1 - threshold) / 2) return 2;
  return 1;
}
