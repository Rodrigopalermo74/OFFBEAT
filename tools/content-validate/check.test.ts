import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkLevel } from "./check.ts";

const voiceLeading = JSON.parse(
  readFileSync(new URL("../../packages/content/levels/club-04-voice-leading-04.json", import.meta.url), "utf8"),
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

const fix = JSON.parse(
  readFileSync(new URL("../../packages/content/levels/bedroom-01-fix-10.json", import.meta.url), "utf8"),
);

describe("checkLevel groove-lab", () => {
  it("acepta el nivel fix de ejemplo", () => {
    expect(checkLevel(fix)).toEqual([]);
  });
  it("en fix los golpes del inicio deben coincidir con el objetivo", () => {
    const kick = [...fix.target.start.tracks.kick];
    kick[1] = 1;
    const wrong = {
      ...fix,
      target: { ...fix.target, start: { ...fix.target.start, tracks: { ...fix.target.start.tracks, kick } } },
    };
    expect(checkLevel(wrong)).toEqual([
      "target.start.tracks.kick: en fix los golpes deben coincidir con el objetivo; solo cambia el feel",
    ]);
  });
  it("fix sin punto de partida es inválido", () => {
    const { start: _start, ...target } = fix.target;
    expect(checkLevel({ ...fix, target })).toEqual(["target.start: fix necesita un punto de partida"]);
  });
  it("rechaza velocities que el jugador no puede elegir", () => {
    const kick = [...fix.target.tracks.kick];
    kick[0] = 0.9;
    expect(checkLevel({ ...fix, target: { ...fix.target, tracks: { ...fix.target.tracks, kick } } })[0]).toMatch(
      /^target\.tracks\.kick\.0: La velocity/,
    );
  });
  it("rechaza voces que el motor no tiene", () => {
    const tracks = { ...fix.target.tracks, cowbell: fix.target.tracks.kick };
    expect(checkLevel({ ...fix, target: { ...fix.target, tracks } }).length).toBeGreaterThan(0);
  });
});

const stack = JSON.parse(
  readFileSync(new URL("../../packages/content/levels/club-04-stack-01.json", import.meta.url), "utf8"),
);

describe("checkLevel deep-chords", () => {
  it("acepta el nivel stack de ejemplo", () => {
    expect(checkLevel(stack)).toEqual([]);
  });
  it("stack pide un solo acorde", () => {
    const wrong = { ...stack, target: { ...stack.target, progression: ["Am7", "Dm7"] } };
    expect(checkLevel(wrong)).toEqual(["target.progression: stack pide un solo acorde"]);
  });
  it("voice-leading pide la misma cantidad de voces en todos los acordes", () => {
    const wrong = { ...voiceLeading, target: { ...voiceLeading.target, progression: ["Am7", "Dm9"] } };
    expect(checkLevel(wrong)).toContain("target.progression: todos los acordes deben tener la misma cantidad de voces");
  });
  it("voice-leading sin optimalCost es inválido", () => {
    const { optimalCost: _cost, ...target } = voiceLeading.target;
    expect(checkLevel({ ...voiceLeading, target })).toEqual(["target.optimalCost: declarado nada, calculado 4"]);
  });
});
