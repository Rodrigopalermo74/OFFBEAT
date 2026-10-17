import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkLevel } from "./check.ts";

const voiceLeading = JSON.parse(
  readFileSync(new URL("../../packages/content/levels/club-04-voice-leading-01.json", import.meta.url), "utf8"),
);

describe("checkLevel", () => {
  it("acepta el nivel de ejemplo", () => {
    expect(checkLevel(voiceLeading)).toEqual([]);
  });
  it("detecta un optimalCost mal declarado", () => {
    const wrong = { ...voiceLeading, target: { ...voiceLeading.target, optimalCost: 9 } };
    expect(checkLevel(wrong)).toEqual(["target.optimalCost: declarado 9, calculado 4"]);
  });
  it("detecta acordes inválidos", () => {
    const wrong = { ...voiceLeading, target: { ...voiceLeading.target, progression: ["Am7", "Hm7"] } };
    expect(checkLevel(wrong)[0]).toContain('acorde inválido "Hm7"');
  });
  it("rechaza BPM fuera de rango", () => {
    expect(checkLevel({ ...voiceLeading, bpm: 174 })[0]).toMatch(/^bpm:/);
  });
});
