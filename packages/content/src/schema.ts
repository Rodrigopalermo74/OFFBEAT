import { z } from "zod";

export const GameId = z.enum(["groove-lab", "deep-chords", "key-shift", "bassline-duel", "phrase-detective"]);

const NoteName = z.string().regex(/^[A-G](#|b)?-?\d$/, "Nota con octava, por ejemplo C3");

export const DeepChordsTarget = z.object({
  progression: z.array(z.string()).min(1),
  barsPerChord: z.number().int().positive(),
  voicingRange: z.tuple([NoteName, NoteName]),
  /** Solo en voice-leading: semitonos totales del mejor encadenamiento posible (lo recalcula el validador). */
  optimalCost: z.number().int().nonnegative().optional(),
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
        ? DeepChordsTarget
        : level.game === "groove-lab"
          ? GrooveLabTarget
          : level.game === "key-shift"
            ? KeyShiftTarget
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
export type BasslineDuelTarget = z.infer<typeof BasslineDuelTarget>;
export type KeyShiftTarget = z.infer<typeof KeyShiftTarget>;
export type GrooveLabTarget = z.infer<typeof GrooveLabTarget>;
export type DrumVoice = z.infer<typeof DrumVoice>;
