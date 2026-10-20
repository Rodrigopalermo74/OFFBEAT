import { describe, expect, it } from "vitest";
import { analyzeStab, type StabTake } from "./oneChordStab.ts";

const key = { tonic: "A", mode: "minor" };
const target: StabTake = { shape: "m9", motion: "parallel", roots: ["A", "C", "D", "C"] };

describe("analyzeStab", () => {
  it("da 1 cuando el stab es idéntico", () => {
    const a = analyzeStab(target, { ...target }, key);
    expect(a.score).toBe(1);
    expect(a.rootsOk).toEqual([true, true, true, true]);
  });

  it("acepta la fundamental escrita con otro nombre", () => {
    const flats: StabTake = { shape: "m7", motion: "parallel", roots: ["Bb", "A"] };
    const sharps: StabTake = { shape: "m7", motion: "parallel", roots: ["A#", "A"] };
    expect(analyzeStab(flats, sharps, key).score).toBe(1);
  });

  it("la forma equivocada no alcanza para pasar (umbral 0.85)", () => {
    const a = analyzeStab(target, { ...target, shape: "m7" }, key);
    expect(a.shapeOk).toBe(false);
    expect(a.score).toBeCloseTo(0.8);
  });

  it("diatónico en vez de paralelo pierde en los compases que no son la tónica", () => {
    const a = analyzeStab(target, { ...target, motion: "diatonic" }, key);
    expect(a.motionOk).toBe(false);
    expect(a.score).toBeLessThan(0.85);
  });

  it("un compás vacío o con la fundamental mal cuenta poco", () => {
    const a = analyzeStab(target, { ...target, roots: ["A", null, "D", "E"] }, key);
    expect(a.rootsOk).toEqual([true, false, true, false]);
    expect(a.score).toBeLessThan(0.6);
  });

  it("en diatónico una fundamental fuera de la escala no suena", () => {
    const diatonic: StabTake = { shape: "m7", motion: "diatonic", roots: ["A", "Bb"] };
    expect(analyzeStab({ ...diatonic, roots: ["A", "B"] }, diatonic, key).score).toBe(0.5);
  });
});
