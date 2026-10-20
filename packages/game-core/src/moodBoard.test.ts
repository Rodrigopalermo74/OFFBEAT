import { describe, expect, it } from "vitest";
import { evaluateMoodBoard, harmonicFunction, passesCheck } from "./moodBoard.ts";

const A_MINOR = { tonic: "A", mode: "minor" };

describe("harmonicFunction", () => {
  it("clasifica los acordes de La menor", () => {
    expect(["Am9", "Dm9", "Em7", "Fmaj7", "G7", "Cmaj7"].map((c) => harmonicFunction(c, A_MINOR))).toEqual([
      "T",
      "PD",
      "D",
      "PD",
      "D",
      "T",
    ]);
  });
});

describe("passesCheck", () => {
  const prog = ["Am9", "G7", "Fmaj7", "G7"];
  it("arranque, final y cadencia con la vuelta del loop", () => {
    expect(passesCheck(prog, A_MINOR, { type: "start", fn: "T" })).toBe(true);
    expect(passesCheck(prog, A_MINOR, { type: "end", fn: "D" })).toBe(true);
    // G7 (D) → Am9 (T) solo pasa al volver al principio del loop.
    expect(passesCheck(prog, A_MINOR, { type: "cadence", from: "D", to: "T" })).toBe(true);
    expect(passesCheck(["Am9", "G7", null, "G7"], A_MINOR, { type: "cadence", from: "D", to: "T" })).toBe(false);
  });
  it("acordes distintos y sin repetir seguido (también en la vuelta)", () => {
    expect(passesCheck(prog, A_MINOR, { type: "distinct", min: 3 })).toBe(true);
    expect(passesCheck(prog, A_MINOR, { type: "no-repeat" })).toBe(true);
    expect(passesCheck(["Am9", "Dm9", "Em7", "Am9"], A_MINOR, { type: "no-repeat" })).toBe(false);
  });
});

describe("evaluateMoodBoard", () => {
  it("completar los compases cuenta como requisito", () => {
    const checks = [{ type: "includes", chord: "Dm9" }] as const;
    expect(evaluateMoodBoard(["Am9", null], A_MINOR, checks).score).toBe(0);
    expect(evaluateMoodBoard(["Am9", "Dm9"], A_MINOR, checks).score).toBe(1);
    expect(evaluateMoodBoard(["Am9", "Em7"], A_MINOR, checks).score).toBe(0.5);
  });
});
