import { DRUM_VOICES, type DrumPattern, type NoteClip } from "@offbeat/audio-engine";
import { chordVoicing } from "@offbeat/theory";

const row = (hits: string) => [...hits].map((c) => (c === "x" ? 1 : c === "o" ? 0.5 : 0));

/** Groove de deep house básico: kick 4/4, clap en 2 y 4, hat abierto en el offbeat, ghost hats. */
export const STARTER_GROOVE: DrumPattern = {
  kick: row("x...x...x...x..."),
  clap: row("....x.......x..."),
  closedHat: row(".o.o.o.o.o.o.o.o"),
  openHat: row("..x...x...x...x."),
  rim: row("...........o..o."),
};

/** Groove mínimo para entrenar el oído: kick 4/4 y hats en el offbeat, sin nada que tape las notas. */
export const EAR_GROOVE: DrumPattern = {
  kick: row("x...x...x...x..."),
  clap: row("................"),
  closedHat: row("..o...o...o...o."),
  openHat: row("................"),
  rim: row("................"),
};

export const VOICE_LABELS: Record<string, string> = {
  kick: "Kick",
  clap: "Clap",
  closedHat: "Hat",
  openHat: "Open hat",
  rim: "Rim",
};

export const EMPTY_GROOVE = Object.fromEntries(
  DRUM_VOICES.map((v) => [v, new Array<number>(16).fill(0)]),
) as DrumPattern;

/** Progresión Am9 → Dm9 → Fmaj7 → Em7, un compás cada uno (64 pasos). */
export const STARTER_PROGRESSION = ["Am9", "Dm9", "Fmaj7", "Em7"];

export function progressionClip(symbols: string[], stepsPerChord = 16): NoteClip[] {
  return symbols.flatMap((symbol, i) =>
    chordVoicing(symbol, 3).map((midi) => ({ midi, start: i * stepsPerChord, length: stepsPerChord })),
  );
}

/** 512 notas pseudoaleatorias deterministas para medir el rendimiento del piano roll. */
export function stressClip(count = 512, steps = 64, low = 48, high = 84): NoteClip[] {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: count }, () => ({
    midi: low + Math.floor(rand() * (high - low + 1)),
    start: Math.floor(rand() * steps),
    length: 1,
  }));
}
