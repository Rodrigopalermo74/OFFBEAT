import { Scale } from "tonal";
import { pitchClass, toMidi } from "./notes.ts";
import { scalePitchClasses } from "./scales.ts";

/**
 * Rueda de Camelot: cada tonalidad es un número (1–12, un paso = una quinta) y una letra
 * (A = menor, B = mayor). 8A es La menor y 8B, su relativo, Do mayor.
 */
export interface CamelotKey {
  number: number;
  letter: "A" | "B";
}

export interface MixKey {
  tonic: string;
  mode: "minor" | "major";
}

/** Cómo se llevan dos tonalidades en la rueda. Las tres primeras mezclan sin chocar. */
export type CamelotRelation = "same" | "relative" | "adjacent" | "diagonal" | "clash";

export const COMPATIBLE_RELATIONS: readonly CamelotRelation[] = ["same", "relative", "adjacent"];

/** Tónicas tal como las escriben los DJs, por número de la rueda (índice 0 = número 1). */
const MINOR_TONICS = ["Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E", "B", "F#", "Db"];
const MAJOR_TONICS = ["B", "F#", "Db", "Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E"];

/** Número de la rueda de una clase de altura: subir una quinta (7 semitonos) suma 1. */
function wheelNumber(pc: number, anchorPc: number): number {
  // pc ≡ anchor + 7·k (mod 12) → k = 7·(pc − anchor) (mod 12), porque 7·7 ≡ 1.
  const k = ((((pc - anchorPc) * 7) % 12) + 12) % 12;
  return ((8 - 1 + k) % 12) + 1;
}

export function camelotOf(key: MixKey): CamelotKey {
  const pc = pitchClass(toMidi(`${key.tonic}4`));
  return key.mode === "minor"
    ? { number: wheelNumber(pc, 9), letter: "A" }
    : { number: wheelNumber(pc, 0), letter: "B" };
}

export function camelotCode(key: MixKey): string {
  const { number, letter } = camelotOf(key);
  return `${number}${letter}`;
}

export function keyOfCamelot({ number, letter }: CamelotKey): MixKey {
  const tonics = letter === "A" ? MINOR_TONICS : MAJOR_TONICS;
  return { tonic: tonics[number - 1] as string, mode: letter === "A" ? "minor" : "major" };
}

/** Las 24 tonalidades de la rueda, de 1A a 12B. */
export const CAMELOT_KEYS: readonly MixKey[] = (["A", "B"] as const).flatMap((letter) =>
  Array.from({ length: 12 }, (_, i) => keyOfCamelot({ number: i + 1, letter })),
);

/** Cifrado americano de la tonalidad: "Am", "F#m", "Db". */
export function mixKeyName(key: MixKey): string {
  return key.mode === "minor" ? `${key.tonic}m` : key.tonic;
}

/** Distancia en la rueda entre dos números, con signo, de −5 a 6 (6 es el lado opuesto). */
export function wheelSteps(from: number, to: number): number {
  const d = (((to - from) % 12) + 12) % 12;
  return d > 6 ? d - 12 : d;
}

export function camelotRelation(a: MixKey, b: MixKey): CamelotRelation {
  const ca = camelotOf(a);
  const cb = camelotOf(b);
  const steps = Math.abs(wheelSteps(ca.number, cb.number));
  if (ca.letter === cb.letter) return steps === 0 ? "same" : steps === 1 ? "adjacent" : "clash";
  return steps === 0 ? "relative" : steps === 1 ? "diagonal" : "clash";
}

export function isCompatible(a: MixKey, b: MixKey): boolean {
  return COMPATIBLE_RELATIONS.includes(camelotRelation(a, b));
}

/** Notas que comparten las dos escalas (de 0 a 7): relativos 7, vecinos 6, opuestos 2. */
export function sharedNotes(a: MixKey, b: MixKey): number {
  const pa = scalePitchClasses(a.tonic, a.mode);
  const pb = new Set(scalePitchClasses(b.tonic, b.mode));
  return pa.filter((pc) => pb.has(pc)).length;
}

/** Notas de `a` que no están en `b` y las que las reemplazan: Am → Em da { out: ["F"], in: ["F#"] }. */
export function changedNotes(a: MixKey, b: MixKey): { out: string[]; in: string[] } {
  const na = Scale.get(`${a.tonic} ${a.mode}`).notes;
  const nb = Scale.get(`${b.tonic} ${b.mode}`).notes;
  const pcs = (notes: string[]) => new Set(notes.map((n) => pitchClass(toMidi(`${n}4`))));
  const pa = pcs(na);
  const pb = pcs(nb);
  return {
    out: na.filter((n) => !pb.has(pitchClass(toMidi(`${n}4`)))),
    in: nb.filter((n) => !pa.has(pitchClass(toMidi(`${n}4`)))),
  };
}
