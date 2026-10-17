import type { Results } from "@offbeat/game-core";

const KEY = "offbeat.results.v1";

/** Progreso local. Si el navegador bloquea el storage, el juego sigue andando sin guardar. */
export function loadResults(): Results {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Results) : {};
  } catch {
    return {};
  }
}

export function saveResults(results: Results): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(results));
  } catch {
    // Sin storage disponible: el progreso dura lo que dure la pestaña.
  }
}
