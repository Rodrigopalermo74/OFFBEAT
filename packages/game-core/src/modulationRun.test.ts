import { camelotCode, type MixKey, MODULATIONS, modulate } from "@offbeat/theory";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { comboTrail, modulationRun, scoreRun } from "./modulationRun.ts";

const am: MixKey = { tonic: "A", mode: "minor" };

describe("modulationRun", () => {
  it("es determinista y encadena: cada paso sale de donde terminó el anterior", () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.constantFrom(...MODULATIONS), { minLength: 1, maxLength: 5 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer(),
        (moves, changes, seed) => {
          const run = modulationRun(am, moves, changes, seed);
          expect(run).toEqual(modulationRun(am, moves, changes, seed));
          expect(run).toHaveLength(changes);
          expect(run[0]?.from).toEqual(am);
          run.forEach((s, i) => {
            expect(moves).toContain(s.move);
            expect(camelotCode(s.to)).toBe(camelotCode(modulate(s.from, s.move)));
            if (i > 0) expect(s.from).toEqual(run[i - 1]?.to);
            if (i > 0 && moves.length > 1) expect(s.move).not.toBe(run[i - 1]?.move);
          });
        },
      ),
    );
  });

  it("reparte las modulaciones de forma pareja", () => {
    const run = modulationRun(am, ["relative", "parallel", "fifth"], 6, 3);
    for (const m of ["relative", "parallel", "fifth"]) expect(run.filter((s) => s.move === m)).toHaveLength(2);
  });
});

describe("combo", () => {
  it("sube con aciertos seguidos hasta ×4 y se corta al fallar", () => {
    expect(comboTrail([true, true, true, true, true, false, true])).toEqual([1, 2, 3, 4, 4, 0, 1]);
  });
  it("todas bien = 1; fallar al principio cuesta menos que fallar en el medio de una racha", () => {
    expect(scoreRun([true, true, true, true, true, true], 6)).toBe(1);
    const early = scoreRun([false, true, true, true, true, true], 6);
    const middle = scoreRun([true, true, true, false, true, true], 6);
    expect(early).toBeGreaterThan(middle);
    expect(scoreRun([], 6)).toBe(0);
  });
});
