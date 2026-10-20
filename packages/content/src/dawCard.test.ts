import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseDawCard } from "./dawCard.ts";

const DIR = new URL("../daw-cards/", import.meta.url);

describe("parseDawCard", () => {
  it("lee todas las tarjetas del repo", () => {
    for (const file of readdirSync(DIR)) {
      const card = parseDawCard(readFileSync(new URL(file, DIR), "utf8"));
      expect(card.daws).toHaveLength(4);
      expect(card.challenge).not.toBe("");
    }
  });
  it("arma la estructura de una tarjeta", () => {
    const card = parseDawCard(readFileSync(new URL("swing-groove-pool.md", DIR), "utf8"));
    expect(card.title).toBe("Ponele swing al groove");
    expect(card.chapter).toBe(1);
    expect(card.daws[2]?.name).toBe("Logic Pro");
    expect(card.daws[2]?.steps[2]).toContain("Q-Swing");
  });
  it("rechaza tarjetas incompletas", () => {
    expect(() => parseDawCard("# Hola\nConcepto: x  ·  Capítulo: 1\n\nAlgo.\n\n## Ableton Live\n1. paso")).toThrow(
      /Los DAW tienen que ser/,
    );
  });
});
