import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  chordDegree,
  chordTones,
  chordVoicing,
  degreeMidi,
  detectChord,
  estimateKey,
  modeDiff,
  optimalProgressionCost,
  romanNumeral,
  scaleDegrees,
  scalePitchClasses,
  smoothVoicing,
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

describe("scaleDegrees", () => {
  it("nombra los grados de La menor contra la escala mayor", () => {
    expect(scaleDegrees("A", "minor").map((d) => `${d.label}:${d.name}`)).toEqual([
      "1:A",
      "2:B",
      "♭3:C",
      "4:D",
      "5:E",
      "♭6:F",
      "♭7:G",
    ]);
  });
  it("los grados no dependen de la tónica (transposición)", () => {
    const tonics = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
    const modes = ["major", "minor", "dorian", "phrygian", "lydian", "mixolydian", "locrian"];
    fc.assert(
      fc.property(fc.constantFrom(...tonics), fc.constantFrom(...tonics), fc.constantFrom(...modes), (a, b, mode) => {
        const labels = (t: string) => scaleDegrees(t, mode).map((d) => d.label);
        expect(labels(a)).toEqual(labels(b));
      }),
    );
  });
});

describe("degreeMidi", () => {
  it("ubica grados y la octava", () => {
    expect(degreeMidi("A", "minor", 1)).toBe(toMidi("A4"));
    expect(degreeMidi("A", "minor", 3)).toBe(toMidi("C5"));
    expect(degreeMidi("A", "minor", 8)).toBe(toMidi("A5"));
    expect(degreeMidi("A", "minor", 5, 3)).toBe(toMidi("E4"));
  });
});

describe("modeDiff", () => {
  it("eólico → dórico cambia la 6ª; eólico → frigio, la 2ª", () => {
    const show = (to: string) => modeDiff("A", "aeolian", to).map((c) => `${c.from.name}→${c.to.name}`);
    expect(show("dorian")).toEqual(["F→F#"]);
    expect(show("phrygian")).toEqual(["B→Bb"]);
    expect(show("mixolydian")).toEqual(["C→C#", "F→F#"]);
  });
  it("es simétrico y vacío contra sí mismo", () => {
    const modes = ["major", "minor", "dorian", "phrygian", "lydian", "mixolydian", "locrian"];
    fc.assert(
      fc.property(fc.constantFrom(...modes), fc.constantFrom(...modes), (a, b) => {
        expect(modeDiff("D", a, a)).toEqual([]);
        expect(modeDiff("D", a, b).map((c) => c.degree)).toEqual(modeDiff("D", b, a).map((c) => c.degree));
      }),
    );
  });
});

describe("romanNumeral y chordDegree", () => {
  it("cifra acordes de La menor", () => {
    const show = (c: string) => romanNumeral(c, "A", "minor");
    expect(["Am9", "Bm7b5", "Cmaj7", "Dm9", "Em7", "Fmaj7", "G7"].map(show)).toEqual([
      "i9",
      "iiø7",
      "IIImaj7",
      "iv9",
      "v7",
      "VImaj7",
      "VII7",
    ]);
  });
  it("el IV7 dórico y los acordes fuera de la escala", () => {
    expect(romanNumeral("D7", "A", "dorian")).toBe("IV7");
    expect(chordDegree("Bb7", "A", "minor")).toBeNull();
  });
});

describe("smoothVoicing", () => {
  it("encadena Am7 → Dm7 moviendo poco", () => {
    const am = smoothVoicing(null, "Am7", 48, 72);
    const dm = smoothVoicing(am, "Dm7", 48, 72);
    expect(voiceLeadingCost(am, dm)).toBeLessThanOrEqual(4);
    expect(dm.every((m) => m >= 48 && m <= 72)).toBe(true);
  });
  it("siempre devuelve las notas del acorde dentro del rango", () => {
    const chords = ["Am9", "Dm9", "Fmaj7", "Em7", "G7", "Cmaj7", "D7"];
    fc.assert(
      fc.property(fc.array(fc.constantFrom(...chords), { minLength: 1, maxLength: 6 }), (prog) => {
        let prev: number[] | null = null;
        for (const c of prog) {
          const v = smoothVoicing(prev, c, 48, 72);
          expect(new Set(v.map((m) => m % 12))).toEqual(new Set(chordTones(c).map((t) => t.pc)));
          expect(v.every((m) => m >= 48 && m <= 72)).toBe(true);
          prev = v;
        }
      }),
      { numRuns: 30 },
    );
  });
});
