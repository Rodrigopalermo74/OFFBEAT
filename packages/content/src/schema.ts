import { z } from "zod";

export const GameId = z.enum(["groove-lab", "deep-chords", "key-shift", "bassline-duel", "phrase-detective"]);

const NoteName = z.string().regex(/^[A-G](#|b)?-?\d$/, "Nota con octava, por ejemplo C3");

export const DeepChordsTarget = z.object({
  progression: z.array(z.string()).min(1),
  barsPerChord: z.number().int().positive(),
  voicingRange: z.tuple([NoteName, NoteName]),
  optimalCost: z.number().int().nonnegative(),
});

export const GrooveLabTarget = z.object({
  steps: z.number().int().positive(),
  swing: z.number().min(0.5).max(0.75),
  tracks: z.record(z.string(), z.array(z.number().min(0).max(1))),
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
