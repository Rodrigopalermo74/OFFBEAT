import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { CAMELOT_KEYS, camelotCode, camelotRelation, type MixKey, sharedNotes } from "./camelot.ts";
import { MODULATIONS, modulate } from "./modulation.ts";

const am: MixKey = { tonic: "A", mode: "minor" };

describe("modulate", () => {
  it("lleva La menor a sus destinos típicos", () => {
    expect(modulate(am, "relative")).toEqual({ tonic: "C", mode: "major" });
    expect(modulate(am, "parallel")).toEqual({ tonic: "A", mode: "major" });
    expect(modulate(am, "fifth")).toEqual({ tonic: "E", mode: "minor" });
    expect(modulate(am, "fourth")).toEqual({ tonic: "D", mode: "minor" });
    expect(modulate(am, "tone")).toEqual({ tonic: "B", mode: "minor" });
    expect(modulate({ tonic: "C", mode: "major" }, "relative")).toEqual(am);
  });

  it("en la rueda: relativo y quinta/cuarta mezclan, el tono sube dos números", () => {
    fc.assert(
      fc.property(fc.constantFrom(...CAMELOT_KEYS), (k) => {
        expect(camelotRelation(k, modulate(k, "relative"))).toBe("relative");
        expect(camelotRelation(k, modulate(k, "fifth"))).toBe("adjacent");
        expect(camelotRelation(k, modulate(k, "fourth"))).toBe("adjacent");
        expect(sharedNotes(k, modulate(k, "tone"))).toBe(5);
        expect(sharedNotes(k, modulate(k, "parallel"))).toBe(4);
      }),
    );
  });

  it("propiedad: relativo y paralelo se deshacen a sí mismos; quinta y cuarta se cancelan", () => {
    fc.assert(
      fc.property(fc.constantFrom(...CAMELOT_KEYS), (k) => {
        expect(camelotCode(modulate(modulate(k, "relative"), "relative"))).toBe(camelotCode(k));
        expect(camelotCode(modulate(modulate(k, "parallel"), "parallel"))).toBe(camelotCode(k));
        expect(camelotCode(modulate(modulate(k, "fifth"), "fourth"))).toBe(camelotCode(k));
      }),
    );
  });

  it("toda modulación llega a otra tonalidad de la rueda", () => {
    for (const k of CAMELOT_KEYS)
      for (const m of MODULATIONS) expect(camelotCode(modulate(k, m))).not.toBe(camelotCode(k));
  });
});
