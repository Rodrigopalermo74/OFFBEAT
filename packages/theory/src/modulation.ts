import { CAMELOT_KEYS, type MixKey } from "./camelot.ts";
import { pitchClass, toMidi } from "./notes.ts";

/**
 * Modulaciones típicas de un track: cambiar el centro tonal sin cambiar las notas (relativo),
 * cambiar mayor/menor sobre la misma tónica (paralelo), moverse un paso en la rueda (quinta o cuarta)
 * o subir todo un tono para levantar la energía.
 */
export const MODULATIONS = ["relative", "parallel", "fifth", "fourth", "tone"] as const;
export type Modulation = (typeof MODULATIONS)[number];

/** Semitonos que se mueve la tónica en cada modulación (el relativo depende del modo de partida). */
export function modulationSemitones(from: MixKey, move: Modulation): number {
  switch (move) {
    case "relative":
      return from.mode === "minor" ? 3 : -3;
    case "parallel":
      return 0;
    case "fifth":
      return 7;
    case "fourth":
      return 5;
    case "tone":
      return 2;
  }
}

/** Tonalidad a la que se llega, con la grafía de la rueda (Db y no C# en mayor, F# y no Gb en menor). */
export function modulate(from: MixKey, move: Modulation): MixKey {
  const pc = pitchClass(toMidi(`${from.tonic}4`) + modulationSemitones(from, move));
  const flip = move === "relative" || move === "parallel";
  const mode = flip ? (from.mode === "minor" ? "major" : "minor") : from.mode;
  const key = CAMELOT_KEYS.find((k) => k.mode === mode && pitchClass(toMidi(`${k.tonic}4`)) === pc);
  if (!key) throw new Error(`No hay tonalidad para ${from.tonic} ${from.mode} + ${move}`);
  return key;
}
