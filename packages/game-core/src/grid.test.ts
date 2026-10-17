import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  crowdMood,
  nextEnergy,
  recordResult,
  scoreFix,
  scoreRecreate,
  sortLevels,
  stars,
  unlockedLevels,
} from "./index.ts";

const row = (s: string) => [...s].map((c) => (c === "x" ? 1 : c === "o" ? 0.4 : 0));
const target = { kick: row("x...x...x...x..."), openHat: row("..x...x...x...x.") };

describe("scoreRecreate", () => {
  it("da 1 con el patrón exacto", () => {
    expect(scoreRecreate(target, target)).toBe(1);
  });
  it("ignora la velocity", () => {
    expect(scoreRecreate(target, { ...target, kick: target.kick.map((v) => v * 0.5) })).toBe(1);
  });
  it("resta por faltantes y sobrantes", () => {
    const played = { kick: row("x...x...x......."), openHat: row("..x...x...x...xx") };
    // 7 aciertos de 8 esperados, 1 sobrante → 7 / 9
    expect(scoreRecreate(target, played)).toBeCloseTo(7 / 9);
  });
  it("un grid vacío contra un objetivo vacío vale 1", () => {
    expect(scoreRecreate({}, {})).toBe(1);
  });
  it("siempre está entre 0 y 1", () => {
    const grid = fc.dictionary(
      fc.constantFrom("kick", "clap", "rim"),
      fc.array(fc.constantFrom(0, 0.4, 1), { minLength: 16, maxLength: 16 }),
    );
    fc.assert(
      fc.property(grid, grid, (a, b) => {
        const s = scoreRecreate(a, b);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(1);
      }),
    );
  });
});

describe("scoreFix", () => {
  const hats = { closedHat: row("xoxoxoxoxoxoxoxo") };
  it("da 1 con swing y velocities exactos", () => {
    expect(scoreFix({ swing: 0.56, tracks: hats }, { swing: 0.56, tracks: hats }, 124)).toBe(1);
  });
  it("castiga el swing equivocado", () => {
    const straight = scoreFix({ swing: 0.58, tracks: hats }, { swing: 0.5, tracks: hats }, 124);
    const close = scoreFix({ swing: 0.58, tracks: hats }, { swing: 0.57, tracks: hats }, 124);
    expect(straight).toBeLessThan(close);
    expect(close).toBeLessThan(1);
  });
  it("castiga velocities planas", () => {
    const flat = { closedHat: row("xxxxxxxxxxxxxxxx") };
    expect(scoreFix({ swing: 0.5, tracks: hats }, { swing: 0.5, tracks: flat }, 124)).toBeLessThan(0.9);
  });
});

describe("crowd", () => {
  it("la energía se acerca al puntaje sin saltar", () => {
    const e = nextEnergy(0, 1);
    expect(e).toBeGreaterThan(0);
    expect(e).toBeLessThan(1);
  });
  it("estados de la pista", () => {
    expect(crowdMood(0.1)).toBe("vacia");
    expect(crowdMood(0.5)).toBe("calentando");
    expect(crowdMood(0.8)).toBe("arriba");
    expect(crowdMood(1)).toBe("explota");
  });
  it("estrellas", () => {
    expect(stars(0.7, 0.8)).toBe(0);
    expect(stars(0.82, 0.8)).toBe(1);
    expect(stars(0.92, 0.8)).toBe(2);
    expect(stars(1, 0.8)).toBe(3);
  });
});

describe("progress", () => {
  const levels = [
    { id: "b", chapter: 0, threshold: 0.8 },
    { id: "a", chapter: 0, threshold: 0.8 },
    { id: "c", chapter: 1, threshold: 0.8 },
  ];
  it("solo el primero está abierto al empezar", () => {
    expect([...unlockedLevels(levels, {})]).toEqual(["a"]);
  });
  it("superar el umbral abre el siguiente", () => {
    expect([...unlockedLevels(levels, { a: 0.85 })]).toEqual(["a", "b"]);
    expect([...unlockedLevels(levels, { a: 0.85, b: 0.5 })]).toEqual(["a", "b"]);
    expect([...unlockedLevels(levels, { a: 0.85, b: 0.9 })]).toEqual(["a", "b", "c"]);
  });
  it("ordena por el número final del id, no alfabéticamente", () => {
    const mixed = [
      { id: "x-01-fix-07", chapter: 1, threshold: 0.9 },
      { id: "x-01-recreate-06", chapter: 1, threshold: 0.9 },
    ];
    expect(sortLevels(mixed).map((l) => l.id)).toEqual(["x-01-recreate-06", "x-01-fix-07"]);
  });
  it("guarda solo el mejor puntaje", () => {
    expect(recordResult({ a: 0.9 }, "a", 0.5)).toEqual({ a: 0.9 });
    expect(recordResult({ a: 0.5 }, "a", 0.9)).toEqual({ a: 0.9 });
  });
});
