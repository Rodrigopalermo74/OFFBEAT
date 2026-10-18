import { chordVoicing, toMidi } from "@offbeat/theory";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { analyzeBar, scoreStack, scoreVoiceLeading } from "./index.ts";

const C3 = toMidi("C3");
const C5 = toMidi("C5");
const notes = (...names: string[]) => names.map(toMidi);

describe("analyzeBar", () => {
  it("acepta un Am7 en cualquier inversión", () => {
    expect(analyzeBar(notes("C3", "E3", "G3", "A3"), "Am7", C3, C5).valid).toBe(true);
  });
  it("dice qué falta y qué sobra", () => {
    expect(analyzeBar(notes("A3", "C4", "F#4"), "Am7", C3, C5)).toEqual({
      valid: false,
      missing: ["E", "G"],
      extra: ["F#4"],
    });
  });
  it("no acepta notas duplicadas ni fuera de rango", () => {
    expect(analyzeBar(notes("A3", "C4", "E4", "G4", "A4"), "Am7", C3, C5).extra).toEqual(["A4"]);
    expect(analyzeBar(notes("A2", "C4", "E4", "G4"), "Am7", C3, C5)).toMatchObject({
      valid: false,
      extra: ["A2"],
      missing: ["A"],
    });
  });
});

describe("scoreStack", () => {
  it("1 con el acorde completo", () => {
    expect(scoreStack(chordVoicing("Am9"), "Am9", C3, C5)).toBe(1);
  });
  it("parcial si falta la novena", () => {
    expect(scoreStack(chordVoicing("Am7"), "Am9", C3, C5)).toBeCloseTo(4 / 5);
  });
});

describe("scoreVoiceLeading", () => {
  const symbols = ["Am7", "Dm7"];
  it("1 con el voicing óptimo", () => {
    const bars = [notes("A3", "C4", "E4", "G4"), notes("A3", "C4", "D4", "F4")];
    expect(scoreVoiceLeading(bars, symbols, 4, C3, C5)).toMatchObject({ score: 1, cost: 4 });
  });
  it("menos de 1 con saltos innecesarios", () => {
    const bars = [chordVoicing("Am7"), chordVoicing("Dm7")];
    const result = scoreVoiceLeading(bars, symbols, 4, C3, C5);
    expect(result.cost).toBeGreaterThan(4);
    expect(result.score).toBeLessThan(1);
  });
  it("crédito parcial si un acorde está mal", () => {
    const bars = [chordVoicing("Am7"), notes("D3", "F3", "A3")];
    expect(scoreVoiceLeading(bars, symbols, 4, C3, C5)).toMatchObject({ score: 0.25, cost: null });
  });
  it("nunca supera 1 ni baja de 0", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 30 }), fc.integer({ min: -12, max: 12 }), (optimal, shift) => {
        const bars = [chordVoicing("Am7", 3), chordVoicing("Dm7", 3)].map((b) => b.map((m) => m + shift));
        const { score } = scoreVoiceLeading(
          bars,
          ["Am7", "Dm7"].map(() => "Am7"),
          optimal,
          0,
          127,
        );
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }),
    );
  });
});
