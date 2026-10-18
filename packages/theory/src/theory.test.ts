import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  chordTones,
  chordVoicing,
  detectChord,
  estimateKey,
  optimalProgressionCost,
  scalePitchClasses,
  toMidi,
  voiceLeadingCost,
} from "./index.ts";

describe("chordVoicing", () => {
  it("apila Am9 por terceras desde A3", () => {
    expect(chordVoicing("Am9", 3)).toEqual([57, 60, 64, 67, 71]);
  });
  it("Fmaj7 desde F3", () => {
    expect(chordVoicing("Fmaj7", 3)).toEqual([53, 57, 60, 64]);
  });
  it("rechaza símbolos inválidos", () => {
    expect(() => chordVoicing("Xzz")).toThrow();
  });
});

describe("detectChord", () => {
  it("reconoce un Am7", () => {
    expect(detectChord([57, 60, 64, 67])).toContain("Am7");
  });
});

describe("voiceLeadingCost", () => {
  it("es 0 para el mismo acorde", () => {
    expect(voiceLeadingCost([57, 60, 64], [57, 60, 64])).toBe(0);
  });
  it("Am → C (posición cercana) mueve 2 semitonos", () => {
    // A C E → G C E
    expect(voiceLeadingCost([57, 60, 64], [55, 60, 64])).toBe(2);
  });
  it("es invariante a transposición", () => {
    const voicing = fc.array(fc.integer({ min: 36, max: 84 }), { minLength: 3, maxLength: 5 });
    fc.assert(
      fc.property(voicing, voicing, fc.integer({ min: -12, max: 12 }), (a, b, t) => {
        fc.pre(a.length === b.length);
        const shift = (xs: number[]) => xs.map((x) => x + t);
        expect(voiceLeadingCost(shift(a), shift(b))).toBe(voiceLeadingCost(a, b));
      }),
    );
  });
  it("es simétrico", () => {
    const voicing = fc.array(fc.integer({ min: 36, max: 84 }), { minLength: 4, maxLength: 4 });
    fc.assert(
      fc.property(voicing, voicing, (a, b) => {
        expect(voiceLeadingCost(a, b)).toBe(voiceLeadingCost(b, a));
      }),
    );
  });
});

describe("optimalProgressionCost", () => {
  it("Am7 → Dm7 en zona de pads cuesta poco (notas comunes)", () => {
    const cost = optimalProgressionCost([chordVoicing("Am7"), chordVoicing("Dm7")], toMidi("C3"), toMidi("C5"));
    // A C E G → A C D F: E→D y G→F = 4 semitonos
    expect(cost).toBe(4);
  });
});

describe("estimateKey", () => {
  it("encuentra La menor en una línea en La menor", () => {
    const line = ["A3", "C4", "E4", "A3", "G3", "E4", "D4", "C4", "B3", "A3"].map((n) => ({
      midi: toMidi(n),
      duration: 1,
    }));
    const [top] = estimateKey(line);
    expect(top).toMatchObject({ tonic: "A", mode: "minor" });
  });
});

describe("scalePitchClasses", () => {
  it("La dórico tiene F#", () => {
    expect(scalePitchClasses("A", "dorian")).toEqual([9, 11, 0, 2, 4, 6, 7]);
  });
});

describe("chordTones", () => {
  it("conserva la ortografía del acorde", () => {
    expect(chordTones("Fmaj7")).toEqual([
      { name: "F", pc: 5 },
      { name: "A", pc: 9 },
      { name: "C", pc: 0 },
      { name: "E", pc: 4 },
    ]);
  });
});
