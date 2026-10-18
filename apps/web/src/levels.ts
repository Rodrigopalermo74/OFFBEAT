import { type DeepChordsTarget, type GrooveLabTarget, Level } from "@offbeat/content";
import { sortLevels } from "@offbeat/game-core";

const files = import.meta.glob("../../../packages/content/levels/*.json", { eager: true, import: "default" });

/** Todos los niveles, validados al cargar: un JSON roto falla en desarrollo, no en silencio. */
const ALL = Object.values(files)
  .map((data) => Level.parse(data))
  .map((level) => ({ ...level, threshold: level.scoring.threshold }));

/** Niveles de Groove Lab en orden de juego. */
export const GROOVE_LEVELS = sortLevels(
  ALL.filter((l) => l.game === "groove-lab").map((l) => ({ ...l, target: l.target as GrooveLabTarget })),
);
export type GrooveLevel = (typeof GROOVE_LEVELS)[number];

/** Niveles de Deep Chords en orden de juego. */
export const CHORD_LEVELS = sortLevels(
  ALL.filter((l) => l.game === "deep-chords").map((l) => ({ ...l, target: l.target as DeepChordsTarget })),
);
export type ChordLevel = (typeof CHORD_LEVELS)[number];

export type AnyLevel = GrooveLevel | ChordLevel;

/** Cada minijuego tiene su propio recorrido de desbloqueo. */
export const TRACKS = [
  { game: "groove-lab", title: "Groove Lab", venue: "Bedroom", levels: GROOVE_LEVELS as AnyLevel[] },
  { game: "deep-chords", title: "Deep Chords", venue: "Club", levels: CHORD_LEVELS as AnyLevel[] },
] as const;

export const CHAPTER_TITLES: Record<number, string> = {
  0: "Pulso",
  1: "Groove",
  4: "Acordes",
};

export const MODE_LABELS: Record<string, string> = {
  recreate: "Recreate",
  fix: "Fix the Groove",
  stack: "Stack the Chord",
  "voice-leading": "Voice Leading",
};
