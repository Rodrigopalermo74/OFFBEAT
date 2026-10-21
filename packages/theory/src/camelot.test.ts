import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  CAMELOT_KEYS,
  camelotCode,
  camelotOf,
  camelotRelation,
  isCompatible,
  keyOfCamelot,
  type MixKey,
  sharedNotes,
} from "./camelot.ts";

const am: MixKey = { tonic: "A", mode: "minor" };

describe("rueda de Camelot", () => {
  it("ubica las tonalidades conocidas", () => {
    expect(camelotCode(am)).toBe("8A");
    expect(camelotCode({ tonic: "C", mode: "major" })).toBe("8B");
    expect(camelotCode({ tonic: "E", mode: "minor" })).toBe("9A");
    expect(camelotCode({ tonic: "D", mode: "minor" })).toBe("7A");
    expect(camelotCode({ tonic: "Ab", mode: "minor" })).toBe("1A");
    expect(camelotCode({ tonic: "G#", mode: "minor" })).toBe("1A");
    expect(camelotCode({ tonic: "C#", mode: "minor" })).toBe("12A");
    expect(camelotCode({ tonic: "E", mode: "major" })).toBe("12B");
    expect(camelotCode({ tonic: "B", mode: "major" })).toBe("1B");
  });

  it("tiene 24 tonalidades distintas que vuelven a su código", () => {
    const codes = CAMELOT_KEYS.map(camelotCode);
    expect(new Set(codes).size).toBe(24);
    for (const key of CAMELOT_KEYS) expect(keyOfCamelot(camelotOf(key))).toEqual(key);
  });

  it("clasifica las relaciones desde 8A", () => {
    expect(camelotRelation(am, am)).toBe("same");
    expect(camelotRelation(am, { tonic: "C", mode: "major" })).toBe("relative");
    expect(camelotRelation(am, { tonic: "E", mode: "minor" })).toBe("adjacent");
    expect(camelotRelation(am, { tonic: "D", mode: "minor" })).toBe("adjacent");
    expect(camelotRelation(am, { tonic: "G", mode: "major" })).toBe("diagonal");
    expect(camelotRelation(am, { tonic: "Eb", mode: "minor" })).toBe("clash");
    expect(camelotRelation(am, { tonic: "Bb", mode: "minor" })).toBe("clash");
  });

  it("cuenta notas compartidas: relativo 7, vecino 6, tritono 2", () => {
    expect(sharedNotes(am, { tonic: "C", mode: "major" })).toBe(7);
    expect(sharedNotes(am, { tonic: "E", mode: "minor" })).toBe(6);
    expect(sharedNotes(am, { tonic: "Eb", mode: "minor" })).toBe(2);
  });

  it("propiedad: compatibles comparten al menos 6 notas y los que chocan, como mucho 5", () => {
    const key = fc.constantFrom(...CAMELOT_KEYS);
    fc.assert(
      fc.property(key, key, (a, b) => {
        const shared = sharedNotes(a, b);
        if (isCompatible(a, b)) expect(shared).toBeGreaterThanOrEqual(6);
        if (camelotRelation(a, b) === "clash") expect(shared).toBeLessThanOrEqual(5);
      }),
    );
  });

  it("propiedad: la relación es simétrica y no cambia al transponer las dos una quinta", () => {
    const key = fc.constantFrom(...CAMELOT_KEYS);
    const up = (k: MixKey) => {
      const c = camelotOf(k);
      return keyOfCamelot({ ...c, number: (c.number % 12) + 1 });
    };
    fc.assert(
      fc.property(key, key, (a, b) => {
        expect(camelotRelation(a, b)).toBe(camelotRelation(b, a));
        expect(camelotRelation(up(a), up(b))).toBe(camelotRelation(a, b));
      }),
    );
  });
});
