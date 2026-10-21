import { z } from "zod";

export const GameId = z.enum(["groove-lab", "deep-chords", "key-shift", "bassline-duel", "phrase-detective"]);

const NoteName = z.string().regex(/^[A-G](#|b)?-?\d$/, "Nota con octava, por ejemplo C3");

const HarmonicFunction = z.enum(["T", "PD", "D"]);

/** Requisitos de un brief de Mood Board (los evalúa game-core). */
export const MoodCheck = z.discriminatedUnion("type", [
  z.object({ type: z.literal("start"), fn: HarmonicFunction }),
  z.object({ type: z.literal("end"), fn: HarmonicFunction }),
  z.object({ type: z.literal("includes"), chord: z.string() }),
  z.object({ type: z.literal("cadence"), from: HarmonicFunction, to: HarmonicFunction }),
  z.object({ type: z.literal("distinct"), min: z.number().int().min(2) }),
  z.object({ type: z.literal("no-repeat") }),
]);

export const DeepChordsTarget = z.object({
  progression: z.array(z.string()).min(1),
  barsPerChord: z.number().int().positive(),
  voicingRange: z.tuple([NoteName, NoteName]),
  /** Solo en voice-leading: semitonos totales del mejor encadenamiento posible (lo recalcula el validador). */
  optimalCost: z.number().int().nonnegative().optional(),
  /** Solo en mood-board: acordes disponibles en los pads (hasta 8). `progression` es una solución de ejemplo. */
  pads: z.array(z.string()).min(2).max(8).optional(),
  /** Solo en mood-board: requisitos del brief que el evaluador revisa. */
  checks: z.array(MoodCheck).optional(),
});

const PitchName = z.string().regex(/^[A-G](#|b)?$/, "Nota sin octava, por ejemplo C o Bb");
const StabShape = z.enum(["m7", "m9", "m11", "7sus4"]);
const StabMotion = z.enum(["parallel", "diatonic"]);

/**
 * Deep Chords, one-chord-stab: suena un stab de varios compases y el jugador lo copia eligiendo
 * la forma, si se mueve en paralelo o diatónico, y la fundamental de cada compás.
 */
export const OneChordStabTarget = z.object({
  shape: StabShape,
  motion: StabMotion,
  /** Una fundamental por compás. */
  roots: z.array(PitchName).min(2).max(8),
  /** Pasos (0–15) en los que pega el stab dentro de cada compás. */
  rhythm: z.array(z.number().int().min(0).max(15)).min(1),
  /** Formas que el jugador puede elegir (la del objetivo tiene que estar). */
  shapes: z.array(StabShape).min(1),
  /** Movimientos que el jugador puede elegir. */
  motions: z.array(StabMotion).min(1),
  /** Si se muestran las fundamentales del objetivo o hay que sacarlas de oído. */
  showRoots: z.boolean(),
});

/**
 * Key Shift. find-the-root: suena la tónica y una nota; el jugador dice el grado (de `degrees`).
 * mode-swap: dos compases en el modo de `key` y dos en otro modo de `modes`; el jugador dice cuál.
 */
export const KeyShiftTarget = z.object({
  rounds: z.number().int().min(3).max(20),
  degrees: z.array(z.number().int().min(1).max(7)).optional(),
  modes: z.array(z.string()).optional(),
});

/**
 * Key Shift · Harmonic Mixing. pick: suena la cubierta A y el jugador elige, entre `candidates` tracks,
 * el que mezcla en tonalidad. ear: suenan las dos cubiertas juntas y el jugador decide si funcionan o chocan.
 */
export const MixKeySchema = z.object({ tonic: z.string(), mode: z.enum(["minor", "major"]) });
export const HarmonicMixingTarget = z.object({
  task: z.enum(["pick", "ear"]),
  rounds: z.number().int().min(3).max(20),
  /** Tonalidades de la cubierta A; la primera es la `key` del nivel. */
  homes: z.array(MixKeySchema).min(1),
  /** Relaciones en la rueda que puede tener la respuesta correcta. */
  relations: z.array(z.enum(["same", "relative", "adjacent"])).min(1),
  candidates: z.number().int().min(2).max(4),
  /** Si se ven los códigos de Camelot y la rueda antes de responder. */
  showCodes: z.boolean(),
});

/**
 * Key Shift · Modulation Run: el track arranca en `key` y modula `changes` veces con movimientos de `moves`;
 * en cada cambio el jugador dice qué modulación fue. Los aciertos seguidos suben el combo.
 */
export const ModulationRunTarget = z.object({
  changes: z.number().int().min(3).max(12),
  moves: z.array(z.enum(["relative", "parallel", "fifth", "fourth", "tone"])).min(2),
  /** Si se ven los códigos de Camelot de cada tonalidad. */
  showCodes: z.boolean(),
});

/** Bassline Duel: la llamada de un compás que el jugador tiene que responder de oído. */
export const BasslineDuelTarget = z.object({
  steps: z.literal(16),
  notes: z
    .array(
      z.object({
        note: NoteName,
        start: z.number().int().min(0),
        length: z.number().int().min(1).max(16),
      }),
    )
    .min(1),
  /** Filas visibles en el piano roll (grave, aguda). */
  range: z.tuple([NoteName, NoteName]),
});

/** Voces de batería que el motor sabe tocar. */
export const DrumVoice = z.enum(["kick", "clap", "closedHat", "openHat", "rim"]);

/** Velocities que el jugador puede elegir con el click (fuerte, media, ghost) más el silencio. */
export const VELOCITIES = [0, 0.4, 0.7, 1] as const;
const Velocity = z.number().refine((v) => (VELOCITIES as readonly number[]).includes(v), {
  message: `La velocity debe ser una de ${VELOCITIES.join(", ")}`,
});

const Swing = z
  .number()
  .min(0.5)
  .max(0.75)
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-9, { message: "El swing va en pasos de 0.01" });

const GrooveTake = z.object({
  swing: Swing,
  tracks: z.partialRecord(DrumVoice, z.array(Velocity)),
});

export const GrooveLabTarget = GrooveTake.extend({
  steps: z.number().int().positive(),
  /** Punto de partida en "fix": mismos golpes que el objetivo, con otro feel. */
  start: GrooveTake.optional(),
});

export const Level = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    chapter: z.number().int().min(0).max(8),
    game: GameId,
    mode: z.string(),
    bpm: z.number().min(110).max(130),
    key: z.object({ tonic: z.string(), mode: z.string() }),
    concepts: z.array(z.string()).min(1),
    soundPack: z.string(),
    target: z.unknown(),
    scoring: z.object({ windowMs: z.number().positive().optional(), threshold: z.number().min(0).max(1) }),
    dawCard: z.string().optional(),
    /** Nombre corto del nivel, visible en el mapa. */
    title: z.string().optional(),
    /** Consigna para el jugador (una o dos oraciones). */
    brief: z.string().optional(),
  })
  .superRefine((level, ctx) => {
    const schema =
      level.game === "deep-chords"
        ? level.mode === "one-chord-stab"
          ? OneChordStabTarget
          : DeepChordsTarget
        : level.game === "groove-lab"
          ? GrooveLabTarget
          : level.game === "key-shift"
            ? level.mode === "harmonic-mixing"
              ? HarmonicMixingTarget
              : level.mode === "modulation-run"
                ? ModulationRunTarget
                : KeyShiftTarget
            : level.game === "bassline-duel"
              ? BasslineDuelTarget
              : null;
    if (!schema) return;
    const parsed = schema.safeParse(level.target);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) ctx.addIssue({ ...issue, path: ["target", ...issue.path] } as never);
    }
  });

export type Level = z.infer<typeof Level>;
export type DeepChordsTarget = z.infer<typeof DeepChordsTarget>;
export type OneChordStabTarget = z.infer<typeof OneChordStabTarget>;
export type BasslineDuelTarget = z.infer<typeof BasslineDuelTarget>;
export type KeyShiftTarget = z.infer<typeof KeyShiftTarget>;
export type HarmonicMixingTarget = z.infer<typeof HarmonicMixingTarget>;
export type ModulationRunTarget = z.infer<typeof ModulationRunTarget>;
export type GrooveLabTarget = z.infer<typeof GrooveLabTarget>;
export type DrumVoice = z.infer<typeof DrumVoice>;
