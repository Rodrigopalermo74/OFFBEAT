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
      level.game === "deep-chords" ? DeepChordsTarget : level.game === "groove-lab" ? GrooveLabTarget : null;
    if (!schema) return;
    const parsed = schema.safeParse(level.target);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) ctx.addIssue({ ...issue, path: ["target", ...issue.path] } as never);
    }
  });

export type Level = z.infer<typeof Level>;
export type DeepChordsTarget = z.infer<typeof DeepChordsTarget>;
export type GrooveLabTarget = z.infer<typeof GrooveLabTarget>;
export type DrumVoice = z.infer<typeof DrumVoice>;
