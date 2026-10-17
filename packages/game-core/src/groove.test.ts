import { describe, expect, it } from "vitest";
import { type Hit, scoreGroove, stepTime } from "./index.ts";

const fourOnTheFloor: Hit[] = [0, 4, 8, 12].map((s) => ({ voice: "kick", time: stepTime(s, 125), velocity: 1 }));

describe("scoreGroove", () => {
  it("da 1 con la referencia exacta", () => {
    expect(scoreGroove(fourOnTheFloor, fourOnTheFloor, { windowMs: 30 }).score).toBe(1);
  });
  it("penaliza golpes de más y de menos", () => {
    const played = [...fourOnTheFloor.slice(1), { voice: "kick", time: 0.06, velocity: 1 }];
    const result = scoreGroove(fourOnTheFloor, played, { windowMs: 30 });
    expect(result.missed).toBe(1);
    expect(result.extra).toBe(1);
    expect(result.score).toBeCloseTo(3 / 5);
  });
  it("baja la nota con errores de timing", () => {
    const late = fourOnTheFloor.map((h) => ({ ...h, time: h.time + 0.015 }));
    const result = scoreGroove(fourOnTheFloor, late, { windowMs: 30, velocityWeight: 0 });
    expect(result.score).toBeCloseTo(0.5);
    expect(result.meanTimingErrorMs).toBeCloseTo(15);
  });
});

describe("stepTime", () => {
  it("sin swing, 1/16 a 120 BPM = 125 ms", () => {
    expect(stepTime(1, 120)).toBeCloseTo(0.125);
  });
  it("con swing 0.6 retrasa los pasos impares", () => {
    expect(stepTime(1, 120, 0.6)).toBeCloseTo(0.15);
    expect(stepTime(2, 120, 0.6)).toBeCloseTo(0.25);
  });
});
