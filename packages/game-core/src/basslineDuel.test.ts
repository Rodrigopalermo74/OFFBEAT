import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { analyzeBassline, scoreBassline } from "./basslineDuel.ts";

// Bajo de octavas en el offbeat: A1 (33) y A2 (45).
const OCTAVES = [
  { midi: 33, start: 2 },
  { midi: 45, start: 6 },
  { midi: 33, start: 10 },
  { midi: 45, start: 14 },
];

describe("analyzeBassline", () => {
  it("una copia exacta vale 1", () => {
    expect(scoreBassline(OCTAVES, OCTAVES)).toBe(1);
    expect(analyzeBassline(OCTAVES, OCTAVES).missed).toEqual([]);
  });
  it("distingue octava equivocada de nota equivocada", () => {
    const played = [
      { midi: 33, start: 2 },
      { midi: 33, start: 6 }, // A en la octava de abajo
      { midi: 31, start: 10 }, // G en vez de A
    ];
    const a = analyzeBassline(OCTAVES, played);
    expect(a.hits).toBe(1);
    expect(a.wrongOctave).toBe(1);
    expect(a.wrongNote).toBe(1);
    expect(a.missed).toHaveLength(3);
    expect(scoreBassline(OCTAVES, played)).toBeCloseTo(1 / 6);
  });
  it("llenar el grid de notas no suma", () => {
    const spam = Array.from({ length: 16 }, (_, start) => ({ midi: 33, start }));
    expect(scoreBassline(OCTAVES, spam)).toBeLessThan(0.15);
  });
  it("transponer llamada y respuesta juntas no cambia el puntaje", () => {
    const note = fc.record({ midi: fc.integer({ min: 28, max: 60 }), start: fc.integer({ min: 0, max: 15 }) });
    fc.assert(
      fc.property(
        fc.array(note, { minLength: 1, maxLength: 8 }),
        fc.array(note),
        fc.integer({ min: -12, max: 12 }),
        (t, p, k) => {
          const up = (ns: typeof t) => ns.map((n) => ({ ...n, midi: n.midi + k }));
          expect(scoreBassline(up(t), up(p))).toBeCloseTo(scoreBassline(t, p));
        },
      ),
    );
  });
});
