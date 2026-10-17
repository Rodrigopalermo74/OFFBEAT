import { type GrooveLabTarget, Level } from "@offbeat/content";
import { sortLevels } from "@offbeat/game-core";

const files = import.meta.glob("../../../packages/content/levels/*.json", { eager: true, import: "default" });

/** Niveles de Groove Lab en orden de juego. Se validan al cargar: un JSON roto falla en desarrollo, no en silencio. */
export const GROOVE_LEVELS = sortLevels(
  Object.values(files)
    .map((data) => Level.parse(data))
    .filter((level) => level.game === "groove-lab")
    .map((level) => ({ ...level, threshold: level.scoring.threshold, target: level.target as GrooveLabTarget })),
);

export type GrooveLevel = (typeof GROOVE_LEVELS)[number];

export const CHAPTER_TITLES: Record<number, string> = {
  0: "Pulso",
  1: "Groove",
};

export const MODE_LABELS: Record<string, string> = {
  recreate: "Recreate",
  fix: "Fix the Groove",
};
