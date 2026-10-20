import {
  type BasslineDuelTarget,
  type DeepChordsTarget,
  type GrooveLabTarget,
  type KeyShiftTarget,
  Level,
} from "@offbeat/content";
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

/** Niveles de Key Shift en orden de juego. */
export const KEY_LEVELS = sortLevels(
  ALL.filter((l) => l.game === "key-shift").map((l) => ({ ...l, target: l.target as KeyShiftTarget })),
);
export type KeyLevel = (typeof KEY_LEVELS)[number];

/** Niveles de Bassline Duel en orden de juego. */
export const BASS_LEVELS = sortLevels(
  ALL.filter((l) => l.game === "bassline-duel").map((l) => ({ ...l, target: l.target as BasslineDuelTarget })),
);
export type BassLevel = (typeof BASS_LEVELS)[number];

export type AnyLevel = GrooveLevel | ChordLevel | KeyLevel | BassLevel;

/** Cada minijuego tiene su propio recorrido de desbloqueo. */
export const TRACKS = [
  { game: "groove-lab", title: "Groove Lab", venue: "Bedroom", levels: GROOVE_LEVELS as AnyLevel[] },
  { game: "bassline-duel", title: "Bassline Duel", venue: "Warehouse", levels: BASS_LEVELS as AnyLevel[] },
  { game: "deep-chords", title: "Deep Chords", venue: "Club", levels: CHORD_LEVELS as AnyLevel[] },
  { game: "key-shift", title: "Key Shift", venue: "Warehouse → Label", levels: KEY_LEVELS as AnyLevel[] },
] as const;

export const CHAPTER_TITLES: Record<number, string> = {
  0: "Pulso",
  1: "Groove",
  2: "Notas y octavas",
  3: "Escalas y oído",
  4: "Acordes",
  5: "Funciones",
  6: "Modos",
};

export const MODE_LABELS: Record<string, string> = {
  recreate: "Recreate",
  fix: "Fix the Groove",
  stack: "Stack the Chord",
  "voice-leading": "Voice Leading",
  "mood-board": "Mood Board",
  "call-response": "Call & Response",
  "find-the-root": "Find the Root",
  "mode-swap": "Mode Swap",
};

/** Nombres de escalas y modos tal como los escribe tonal, en castellano. */
export const SCALE_NAMES: Record<string, string> = {
  major: "mayor",
  minor: "menor",
  ionian: "jónico",
  dorian: "dórico",
  phrygian: "frigio",
  lydian: "lidio",
  mixolydian: "mixolidio",
  aeolian: "eólico",
  locrian: "locrio",
};
