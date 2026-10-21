import {
  type BasslineDuelTarget,
  type DeepChordsTarget,
  type GrooveLabTarget,
  type HarmonicMixingTarget,
  type KeyShiftTarget,
  Level,
  type OneChordStabTarget,
} from "../../packages/content/src/schema.ts";
import { passesCheck } from "../../packages/game-core/src/moodBoard.ts";
import {
  camelotCode,
  chordDegree,
  chordVoicing,
  modeDiff,
  optimalProgressionCost,
  scaleDegrees,
  scalePitchClasses,
  stabNotes,
  stabRootMidi,
  toMidi,
} from "../../packages/theory/src/index.ts";

/** Valida un nivel: esquema Zod + verificación musical. Devuelve la lista de errores (vacía si está bien). */
export function checkLevel(data: unknown): string[] {
  const parsed = Level.safeParse(data);
  if (!parsed.success) {
    return parsed.error.issues.map((i) => `${i.path.join(".") || "(raíz)"}: ${i.message}`);
  }
  const level = parsed.data;
  const errors: string[] = [];

  if (level.game === "deep-chords" && level.mode === "one-chord-stab") {
    const target = level.target as OneChordStabTarget;
    if (!target.shapes.includes(target.shape))
      errors.push(`target.shapes: falta la forma del objetivo (${target.shape})`);
    if (!target.motions.includes(target.motion)) {
      errors.push(`target.motions: falta el movimiento del objetivo (${target.motion})`);
    }
    if (new Set(target.shapes).size !== target.shapes.length) errors.push("target.shapes: hay formas repetidas");
    if (new Set(target.motions).size !== target.motions.length)
      errors.push("target.motions: hay movimientos repetidos");
    if (new Set(target.rhythm).size !== target.rhythm.length) errors.push("target.rhythm: hay pasos repetidos");
    for (const root of target.roots) {
      try {
        stabNotes(stabRootMidi(root), target.shape, target.motion, level.key.tonic, level.key.mode);
      } catch {
        errors.push(`target.roots: ${root} no está en ${level.key.tonic} ${level.key.mode} y el stab es diatónico`);
      }
    }
    if (target.motions.length > 1) {
      const differs = target.roots.some((root) => {
        try {
          const midi = stabRootMidi(root);
          const a = stabNotes(midi, target.shape, "parallel", level.key.tonic, level.key.mode);
          const b = stabNotes(midi, target.shape, "diatonic", level.key.tonic, level.key.mode);
          return a.join() !== b.join();
        } catch {
          return true;
        }
      });
      if (!differs) errors.push("target.roots: paralelo y diatónico suenan igual con estas fundamentales");
    }
  } else if (level.game === "deep-chords") {
    const target = level.target as DeepChordsTarget;
    const voicings: number[][] = [];
    for (const symbol of target.progression) {
      try {
        voicings.push(chordVoicing(symbol));
      } catch {
        errors.push(`target.progression: acorde inválido "${symbol}"`);
      }
    }
    const [low, high] = target.voicingRange.map(toMidi) as [number, number];
    if (low >= high) errors.push("target.voicingRange: el rango está invertido");
    if (level.mode === "stack" && target.progression.length !== 1) {
      errors.push("target.progression: stack pide un solo acorde");
    }
    if (level.mode === "voice-leading") {
      if (target.progression.length < 2) errors.push("target.progression: voice-leading necesita al menos dos acordes");
      if (new Set(voicings.map((v) => v.length)).size > 1) {
        errors.push("target.progression: todos los acordes deben tener la misma cantidad de voces");
      }
      if (errors.length === 0) {
        const cost = optimalProgressionCost(voicings, low, high);
        if (cost !== target.optimalCost) {
          errors.push(`target.optimalCost: declarado ${target.optimalCost ?? "nada"}, calculado ${cost}`);
        }
      }
    }
    if (level.mode === "mood-board") {
      const pads = target.pads ?? [];
      if (pads.length < 2) errors.push("target.pads: mood-board necesita al menos dos pads");
      for (const pad of pads) {
        try {
          if (chordDegree(pad, level.key.tonic, level.key.mode) === null) {
            errors.push(`target.pads: la fundamental de ${pad} no está en ${level.key.tonic} ${level.key.mode}`);
          }
        } catch {
          errors.push(`target.pads: acorde inválido "${pad}"`);
        }
      }
      for (const chord of target.progression) {
        if (!pads.includes(chord)) errors.push(`target.progression: ${chord} no está en los pads`);
      }
      const padsOk = errors.length === 0;
      for (const check of target.checks ?? []) {
        if (check.type === "includes" && !pads.includes(check.chord)) {
          errors.push(`target.checks: pide ${check.chord}, que no está en los pads`);
        } else if (padsOk && !passesCheck(target.progression, level.key, check)) {
          errors.push(`target.progression: el ejemplo no cumple ${JSON.stringify(check)}`);
        }
      }
    } else if (target.pads || target.checks) {
      errors.push("target.pads y target.checks son solo para mood-board");
    }
    if (!["stack", "voice-leading", "mood-board"].includes(level.mode)) {
      errors.push(`mode: "${level.mode}" no existe en deep-chords (stack, voice-leading, mood-board o one-chord-stab)`);
    }
  }

  if (level.game === "groove-lab") {
    const target = level.target as GrooveLabTarget;
    const lengthErrors = (tracks: GrooveLabTarget["tracks"], where: string) => {
      for (const [voice, steps] of Object.entries(tracks)) {
        if (steps && steps.length !== target.steps) {
          errors.push(`${where}.${voice}: tiene ${steps.length} pasos, se esperaban ${target.steps}`);
        }
      }
    };
    lengthErrors(target.tracks, "target.tracks");
    if (level.mode === "recreate" && target.start) {
      errors.push("target.start: en recreate el jugador arranca con el grid vacío");
    }
    if (level.mode === "fix") {
      if (!target.start) {
        errors.push("target.start: fix necesita un punto de partida");
      } else {
        lengthErrors(target.start.tracks, "target.start.tracks");
        const voices = new Set([...Object.keys(target.tracks), ...Object.keys(target.start.tracks)]);
        for (const voice of voices) {
          const want = target.tracks[voice as keyof typeof target.tracks] ?? [];
          const has = target.start.tracks[voice as keyof typeof target.start.tracks] ?? [];
          if (want.some((v, i) => v > 0 !== (has[i] ?? 0) > 0)) {
            errors.push(
              `target.start.tracks.${voice}: en fix los golpes deben coincidir con el objetivo; solo cambia el feel`,
            );
          }
        }
      }
    }
    if (level.mode !== "recreate" && level.mode !== "fix") {
      errors.push(`mode: "${level.mode}" no existe en groove-lab (recreate o fix)`);
    }
  }

  if (level.game === "key-shift") {
    const target = level.target as KeyShiftTarget;
    const { tonic, mode } = level.key;
    try {
      scaleDegrees(tonic, mode);
    } catch {
      errors.push(`key: "${tonic} ${mode}" no es una escala de siete notas`);
    }
    if (level.mode === "harmonic-mixing") {
      const mix = level.target as HarmonicMixingTarget;
      const first = mix.homes[0];
      if (first && (first.tonic !== tonic || first.mode !== mode)) {
        errors.push(`target.homes: la primera cubierta (${first.tonic} ${first.mode}) tiene que ser la key del nivel`);
      }
      const codes = mix.homes.flatMap((h) => {
        try {
          return [camelotCode(h)];
        } catch {
          errors.push(`target.homes: "${h.tonic}" no es una tónica válida`);
          return [];
        }
      });
      if (new Set(codes).size !== codes.length) errors.push("target.homes: hay tonalidades repetidas en la rueda");
      if (new Set(mix.relations).size !== mix.relations.length)
        errors.push("target.relations: hay relaciones repetidas");
      if (mix.task === "ear" && mix.candidates !== 2) {
        errors.push("target.candidates: en ear el jugador elige entre funciona y choca, tiene que ser 2");
      }
    } else if (level.mode === "find-the-root") {
      const degrees = target.degrees ?? [];
      if (degrees.length < 2) errors.push("target.degrees: find-the-root necesita al menos dos grados");
      if (new Set(degrees).size !== degrees.length) errors.push("target.degrees: hay grados repetidos");
      if (target.modes) errors.push("target.modes: find-the-root no usa modos");
    } else if (level.mode === "mode-swap") {
      const modes = target.modes ?? [];
      if (modes.length < 2) errors.push("target.modes: mode-swap necesita al menos dos modos para elegir");
      if (new Set(modes).size !== modes.length) errors.push("target.modes: hay modos repetidos");
      if (target.degrees) errors.push("target.degrees: mode-swap no usa grados");
      for (const m of modes) {
        try {
          if (modeDiff(tonic, mode, m).length === 0) {
            errors.push(`target.modes: "${m}" suena igual que ${tonic} ${mode}, no hay cambio que detectar`);
          }
        } catch {
          errors.push(`target.modes: "${m}" no es un modo válido`);
        }
      }
    } else {
      errors.push(`mode: "${level.mode}" no existe en key-shift (find-the-root, mode-swap o harmonic-mixing)`);
    }
  }

  if (level.game === "bassline-duel") {
    const target = level.target as BasslineDuelTarget;
    const [low, high] = target.range.map(toMidi) as [number, number];
    if (low >= high) errors.push("target.range: el rango está invertido");
    const scale = scalePitchClasses(level.key.tonic, level.key.mode);
    const sorted = [...target.notes].sort((a, b) => a.start - b.start);
    sorted.forEach((n, i) => {
      const midi = toMidi(n.note);
      if (midi < low || midi > high) errors.push(`target.notes: ${n.note} queda fuera del rango`);
      if (!scale.includes(midi % 12))
        errors.push(`target.notes: ${n.note} no está en ${level.key.tonic} ${level.key.mode}`);
      if (n.start + n.length > target.steps)
        errors.push(`target.notes: ${n.note} en el paso ${n.start} se pasa del compás`);
      const next = sorted[i + 1];
      if (next && n.start + n.length > next.start) {
        errors.push(`target.notes: ${n.note} (paso ${n.start}) se pisa con la siguiente; el bajo es monofónico`);
      }
    });
    if (level.mode !== "call-response") {
      errors.push(`mode: "${level.mode}" no existe en bassline-duel (call-response)`);
    }
  }

  return errors;
}
