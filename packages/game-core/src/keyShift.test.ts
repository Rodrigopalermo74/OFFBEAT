import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { bestStreak, questionSequence, scoreQuiz } from "./keyShift.ts";

describe("questionSequence", () => {
  it("es determinista por semilla", () => {
    expect(questionSequence([1, 3, 5], 8, 42)).toEqual(questionSequence([1, 3, 5], 8, 42));
  });
  it("respeta el pool, no repite seguido y usa todas las opciones si alcanzan las rondas", () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.integer({ min: 1, max: 7 }), { minLength: 2, maxLength: 7 }),
        fc.integer({ min: 1, max: 20 }),
        fc.integer(),
        (pool, rounds, seed) => {
          const qs = questionSequence(pool, rounds, seed);
          expect(qs).toHaveLength(rounds);
          for (const q of qs) expect(pool).toContain(q);
          for (let i = 1; i < qs.length; i++) expect(qs[i]).not.toBe(qs[i - 1]);
          if (rounds >= pool.length) expect(new Set(qs).size).toBe(pool.length);
        },
      ),
    );
  });
  it("con una sola opción la repite", () => {
    expect(questionSequence(["dorian"], 3, 1)).toEqual(["dorian", "dorian", "dorian"]);
  });
});

describe("scoreQuiz y bestStreak", () => {
  it("cuenta aciertos sobre las rondas del nivel", () => {
    expect(scoreQuiz([true, false, true, true], 4)).toBe(0.75);
    expect(scoreQuiz([true, true], 4)).toBe(0.5);
  });
  it("mide la mejor racha", () => {
    expect(bestStreak([true, true, false, true, true, true, false])).toBe(3);
    expect(bestStreak([])).toBe(0);
  });
});
