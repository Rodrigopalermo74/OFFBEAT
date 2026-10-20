import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { fromMidi } from "./notes.ts";
import { scalePitchClasses } from "./scales.ts";
import { STAB_SHAPES, stabName, stabNotes, stabRootMidi } from "./stabs.ts";

const names = (notes: number[]) => notes.map((m) => fromMidi(m, true));

describe("stabs", () => {
  it("arma las formas en paralelo sobre cualquier fundamental", () => {
    expect(names(stabNotes(stabRootMidi("A"), "m7", "parallel", "A", "minor"))).toEqual(["A3", "C4", "E4", "G4"]);
    expect(names(stabNotes(stabRootMidi("C"), "m9", "parallel", "A", "minor"))).toEqual([
      "C3",
      "Eb3",
      "G3",
      "Bb3",
      "D4",
    ]);
    expect(names(stabNotes(stabRootMidi("A"), "m11", "parallel", "A", "minor"))).toEqual([
      "A3",
      "E4",
      "G4",
      "C5",
      "D5",
    ]);
  });

  it("en diatónico la forma se adapta a la escala", () => {
    expect(names(stabNotes(stabRootMidi("C"), "m7", "diatonic", "A", "minor"))).toEqual(["C3", "E3", "G3", "B3"]);
    expect(stabName(stabRootMidi("F"), "m9", "diatonic", "A", "minor")).toBe("Fmaj9");
    expect(stabName(stabRootMidi("D"), "m9", "diatonic", "A", "minor")).toBe("Dm9");
    expect(stabName(stabRootMidi("C"), "m9", "parallel", "A", "minor")).toBe("Cm9");
    expect(() => stabNotes(stabRootMidi("Bb"), "m7", "diatonic", "A", "minor")).toThrow();
  });

  it("sobre la tónica menor, paralelo y diatónico suenan igual", () => {
    for (const shape of ["m7", "m9", "m11"] as const) {
      const root = stabRootMidi("A");
      expect(stabNotes(root, shape, "diatonic", "A", "minor")).toEqual(
        stabNotes(root, shape, "parallel", "A", "minor"),
      );
    }
  });

  it("paralelo: transponer la fundamental transpone el stab entero", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...STAB_SHAPES),
        fc.integer({ min: 36, max: 72 }),
        fc.integer({ min: -12, max: 12 }),
        (shape, root, k) => {
          const a = stabNotes(root, shape, "parallel", "A", "minor");
          const b = stabNotes(root + k, shape, "parallel", "A", "minor");
          expect(b).toEqual(a.map((m) => m + k));
        },
      ),
    );
  });

  it("diatónico: todas las notas quedan en la escala y suben", () => {
    const tonics = ["A", "D", "F#", "C"];
    const modes = ["minor", "dorian", "phrygian", "major"];
    fc.assert(
      fc.property(
        fc.constantFrom(...STAB_SHAPES),
        fc.constantFrom(...tonics),
        fc.constantFrom(...modes),
        fc.integer({ min: 0, max: 6 }),
        (shape, tonic, mode, degree) => {
          const scale = scalePitchClasses(tonic, mode);
          const root = 48 + (((scale[degree] as number) - 0 + 12) % 12);
          const notes = stabNotes(root, shape, "diatonic", tonic, mode);
          expect(notes.every((m) => scale.includes(m % 12))).toBe(true);
          expect(notes.every((m, i) => i === 0 || m > (notes[i - 1] as number))).toBe(true);
        },
      ),
    );
  });
});
