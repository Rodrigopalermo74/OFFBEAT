import { camelotRelation, isCompatible, type MixKey, sharedNotes } from "@offbeat/theory";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { type MixSetup, mixingRounds } from "./harmonicMixing.ts";

const am: MixKey = { tonic: "A", mode: "minor" };
const dm: MixKey = { tonic: "D", mode: "minor" };
const pick: MixSetup = { task: "pick", rounds: 6, homes: [am], relations: ["relative", "adjacent"], candidates: 3 };

describe("mixingRounds", () => {
  it("es determinista por semilla", () => {
    expect(mixingRounds(pick, 7)).toEqual(mixingRounds(pick, 7));
  });

  it("pick: un solo candidato compatible, con la relación pedida, y el resto choca", () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer({ min: 2, max: 4 }), (seed, candidates) => {
        const rounds = mixingRounds({ ...pick, homes: [am, dm], candidates }, seed);
        expect(rounds).toHaveLength(6);
        for (const r of rounds) {
          if (r.task !== "pick") throw new Error("esperaba pick");
          expect(r.candidates).toHaveLength(candidates);
          expect(new Set(r.candidates).size).toBe(candidates);
          r.candidates.forEach((k, i) => {
            if (i === r.answer) expect(["relative", "adjacent"]).toContain(camelotRelation(r.home, k));
            else expect(camelotRelation(r.home, k)).toBe("clash");
          });
        }
      }),
    );
  });

  it("reparte las relaciones pedidas", () => {
    const rounds = mixingRounds(pick, 3);
    const relations = rounds.map((r) =>
      r.task === "pick" ? camelotRelation(r.home, r.candidates[r.answer] as MixKey) : "",
    );
    expect(relations.filter((r) => r === "relative")).toHaveLength(3);
    expect(relations.filter((r) => r === "adjacent")).toHaveLength(3);
  });

  it("ear: mitad funciona y mitad choca, y los choques se oyen (4 notas en común o menos)", () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const rounds = mixingRounds({ ...pick, task: "ear" }, seed);
        expect(rounds.filter((r) => r.task === "ear" && r.compatible)).toHaveLength(3);
        for (const r of rounds) {
          if (r.task !== "ear") throw new Error("esperaba ear");
          expect(isCompatible(r.home, r.other)).toBe(r.compatible);
          if (!r.compatible) expect(sharedNotes(r.home, r.other)).toBeLessThanOrEqual(4);
        }
      }),
    );
  });
});
