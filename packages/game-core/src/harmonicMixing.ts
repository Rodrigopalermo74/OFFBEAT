/**
 * Key Shift · Harmonic Mixing: rondas de mezcla armónica con la rueda de Camelot.
 * pick: suena el track de la cubierta A y el jugador elige cuál de los candidatos mezcla en tonalidad.
 * ear: suenan los dos tracks juntos y el jugador decide de oído si funcionan o chocan.
 */
import { CAMELOT_KEYS, type CamelotRelation, camelotRelation, type MixKey, sharedNotes } from "@offbeat/theory";
import { mulberry32 } from "./keyShift.ts";

export type MixTask = "pick" | "ear";

export interface MixSetup {
  task: MixTask;
  rounds: number;
  /** Tonalidades posibles de la cubierta A. */
  homes: readonly MixKey[];
  /** Relaciones que puede tener la respuesta correcta con la cubierta A. */
  relations: readonly CamelotRelation[];
  /** Cantidad de candidatos en pick (2–4). */
  candidates: number;
}

export type MixRound =
  | { task: "pick"; home: MixKey; candidates: MixKey[]; answer: number }
  | { task: "ear"; home: MixKey; other: MixKey; compatible: boolean };

/** `rounds` elementos de `pool`, repartidos lo más parejo posible y mezclados. */
function balanced<T>(pool: readonly T[], rounds: number, rand: () => number): T[] {
  const out = Array.from({ length: rounds }, (_, i) => pool[i % pool.length] as T);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

function pickOne<T>(options: readonly T[], rand: () => number): T {
  if (options.length === 0) throw new Error("No hay tonalidades para elegir");
  return options[Math.floor(rand() * options.length)] as T;
}

const withRelation = (home: MixKey, relation: CamelotRelation) =>
  CAMELOT_KEYS.filter((k) => camelotRelation(home, k) === relation);

/** Tonalidades que chocan con `home`; `strong` deja solo las que comparten 4 notas o menos (se oye clarito). */
const clashes = (home: MixKey, strong: boolean) =>
  withRelation(home, "clash").filter((k) => !strong || sharedNotes(home, k) <= 4);

/** Rondas de una partida, deterministas por semilla. */
export function mixingRounds(setup: MixSetup, seed: number): MixRound[] {
  const rand = mulberry32(seed);
  const homes = balanced(setup.homes, setup.rounds, rand);
  const relations = balanced(setup.relations, setup.rounds, rand);
  const verdicts = balanced([true, false], setup.rounds, rand);
  return homes.map((home, i) => {
    const relation = relations[i] as CamelotRelation;
    if (setup.task === "ear") {
      const compatible = verdicts[i] as boolean;
      const other = compatible ? pickOne(withRelation(home, relation), rand) : pickOne(clashes(home, true), rand);
      return { task: "ear", home, other, compatible };
    }
    const right = pickOne(withRelation(home, relation), rand);
    const wrong: MixKey[] = [];
    const pool = clashes(home, false);
    while (wrong.length < setup.candidates - 1) {
      const k = pickOne(pool, rand);
      if (!wrong.includes(k)) wrong.push(k);
    }
    const answer = Math.floor(rand() * setup.candidates);
    const candidates = [...wrong.slice(0, answer), right, ...wrong.slice(answer)];
    return { task: "pick", home, candidates, answer };
  });
}
