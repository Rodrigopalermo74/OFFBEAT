import type { AudioEngine, NoteClip } from "@offbeat/audio-engine";
import { comboTrail, MAX_COMBO, modulationRun, scoreRun, stars } from "@offbeat/game-core";
import {
  camelotCode,
  changedNotes,
  type MixKey,
  type Modulation,
  mixKeyName,
  modulationSemitones,
  scalePitchClasses,
} from "@offbeat/theory";
import { PianoRoll } from "@offbeat/ui-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DawCard } from "../../components/DawCard.tsx";
import { GameHeader } from "../../components/GameHeader.tsx";
import { Stars } from "../../components/Stars.tsx";
import type { RunLevel } from "../../levels.ts";
import { EAR_GROOVE } from "../../patterns.ts";
import { runTonics, sectionBass, sectionClip } from "./clips.ts";

interface ModulationRunProps {
  level: RunLevel;
  engine: AudioEngine;
  best: number;
  onFinish(score: number): void;
  onExit(): void;
  onNext?: () => void;
}

const LOOP = 64;
const HALF = LOOP / 2;

const MOVES: Record<Modulation, { label: string; detail: string }> = {
  relative: { label: "Relativo", detail: "Mismas notas, cambia el centro" },
  parallel: { label: "Paralelo", detail: "Misma tónica, de menor a mayor o al revés" },
  fifth: { label: "Quinta arriba", detail: "Un paso en la rueda: cambia una nota" },
  fourth: { label: "Cuarta arriba", detail: "Un paso atrás en la rueda: cambia una nota" },
  tone: { label: "Un tono arriba", detail: "Todo sube dos semitonos" },
};

/** `?seed=N` fija el run (para tests); si no, cada partida sale distinta. */
function initialSeed(): number {
  const param = new URLSearchParams(window.location.search).get("seed");
  return param !== null && Number.isFinite(Number(param)) ? Number(param) : Math.floor(Math.random() * 2 ** 31);
}
const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

function why(from: MixKey, to: MixKey, move: Modulation): string {
  if (move === "relative") return `mismas siete notas, el centro pasa de ${from.tonic} a ${to.tonic}`;
  const swap = changedNotes(from, to);
  const notes = `cambia ${swap.out.join(", ")} por ${swap.in.join(", ")}`;
  if (move === "parallel") return `la tónica sigue en ${to.tonic}; ${notes}`;
  if (move === "tone") return `todo sube dos semitonos; ${notes}`;
  return notes;
}

export function ModulationRun({ level, engine, best, onFinish, onExit, onNext }: ModulationRunProps) {
  const { changes, moves, showCodes } = level.target;
  const start = useMemo<MixKey>(
    () => ({ tonic: level.key.tonic, mode: level.key.mode as MixKey["mode"] }),
    [level.key.tonic, level.key.mode],
  );

  const [seed, setSeed] = useState(initialSeed);
  const run = useMemo(() => modulationRun(start, moves, changes, seed), [start, moves, changes, seed]);
  const tonics = useMemo(
    () =>
      runTonics(
        start,
        run.map((s) => modulationSemitones(s.from, s.move)),
      ),
    [start, run],
  );
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<{ chosen: Modulation; correct: boolean }[]>([]);
  const [playing, setPlaying] = useState(false);

  const step = run[index] ?? (run.at(-1) as (typeof run)[number]);
  const answered = answers.length > index;
  const finished = answers.length === changes;
  const last = answers[index];
  const combos = comboTrail(answers.map((a) => a.correct));
  const combo = combos.at(-1) ?? 0;
  const score = scoreRun(
    answers.map((a) => a.correct),
    changes,
  );

  const clip = useMemo(() => {
    const from = tonics[index] as number;
    const to = tonics[index + 1] as number;
    const first = sectionClip(step.from, from, 0);
    const second = sectionClip(step.to, to, HALF);
    return {
      pad: [...first, ...second],
      first,
      bass: [...sectionBass(from, 0), ...sectionBass(to, HALF)],
      low: Math.min(from, to),
    };
  }, [step, tonics, index]);
  const shown: NoteClip[] = answered ? clip.pad : clip.first;

  useEffect(() => {
    engine.setBpm(level.bpm);
    engine.setSwing(0.54);
    engine.setDrumPattern(EAR_GROOVE);
  }, [engine, level.bpm]);
  useEffect(() => engine.setPadClip(clip.pad, LOOP), [engine, clip]);
  useEffect(() => engine.setBassClip(clip.bass, LOOP), [engine, clip]);
  useEffect(() => () => engine.stop(), [engine]);

  const togglePlay = useCallback(() => {
    if (playing) engine.stop();
    else engine.play();
    setPlaying(!playing);
  }, [engine, playing]);

  const answer = useCallback(
    (chosen: Modulation) => {
      if (answered || finished) return;
      const next = [...answers, { chosen, correct: chosen === step.move }];
      setAnswers(next);
      if (next.length === changes) {
        onFinish(
          scoreRun(
            next.map((a) => a.correct),
            changes,
          ),
        );
      }
    },
    [answered, finished, answers, step, changes, onFinish],
  );

  const advance = useCallback(() => {
    if (finished) {
      setSeed(randomSeed());
      setAnswers([]);
      setIndex(0);
    } else if (answered) {
      setIndex((i) => i + 1);
    }
  }, [finished, answered]);

  // Atajos: números para la modulación, Espacio, Enter para el próximo cambio, Esc para salir.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const move = moves[Number(e.key) - 1];
      if (move && /^[1-9]$/.test(e.key)) {
        answer(move);
      } else if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "Enter") {
        e.preventDefault();
        advance();
      } else if (e.key === "Escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moves, answer, togglePlay, advance, onExit]);

  const name = (k: MixKey, reveal = showCodes) => (reveal ? `${mixKeyName(k)} · ${camelotCode(k)}` : mixKeyName(k));
  const feedback = (() => {
    if (!last) return null;
    const head = `${mixKeyName(step.from)} → ${mixKeyName(step.to)} (${camelotCode(step.from)} → ${camelotCode(step.to)})`;
    const reason = why(step.from, step.to, step.move);
    return last.correct
      ? `✓ ${MOVES[step.move].label}: ${head}, ${reason}.${combo > 1 ? ` Combo ×${combo}.` : ""}`
      : `✗ Era ${MOVES[step.move].label.toLowerCase()}, no ${MOVES[last.chosen].label.toLowerCase()}: ${head}, ${reason}.`;
  })();

  const passed = finished && score >= level.threshold;
  const earned = finished ? stars(score, level.threshold) : 0;
  const getPlayhead = useCallback(() => (playing ? engine.getPositionSteps() : null), [engine, playing]);
  const current = answered ? step.to : step.from;

  return (
    <main className="app">
      <GameHeader level={level} best={best} onExit={onExit} detail={name(current)} />

      <section>
        <div className="section-head">
          <button type="button" className="primary" onClick={togglePlay} data-testid="play">
            {playing ? "Stop" : "Play"} <kbd>Espacio</kbd>
          </button>
          <span className="meta" data-testid="round">
            Cambio {Math.min(index + 1, changes)} de {changes}
          </span>
          <span className={`combo ${combo > 1 ? "is-hot" : ""}`} data-testid="combo">
            <span className="eyebrow">Combo</span>×{Math.max(combo, 1)}
            <span className="combo__leds" aria-hidden="true">
              {Array.from({ length: MAX_COMBO }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: un LED por nivel de combo
                <span key={i} className={`led ${i < combo ? "is-on" : ""}`} />
              ))}
            </span>
          </span>
        </div>

        <ol className="route" aria-label="Recorrido de tonalidades" data-testid="route">
          <li className={`route__key ${index === 0 && !answered ? "is-current" : "is-past"}`}>{name(start)}</li>
          {run.map((s, i) => {
            const known = i < index || (i === index && answered);
            const a = answers[i];
            return (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: una parada por cambio
                key={i}
                className={`route__key ${known ? (i === index ? "is-current" : "is-past") : ""} ${a ? (a.correct ? "ok" : "ko") : ""}`}
              >
                <span className="route__move">{known ? MOVES[s.move].label : i === index ? "¿?" : ""}</span>
                {known ? name(s.to) : "··"}
              </li>
            );
          })}
        </ol>

        <p className="hint">
          Dos compases en {mixKeyName(step.from)} y dos en la tonalidad nueva. ¿Qué modulación fue? Las filas resaltadas
          son la escala: se repintan cuando respondés.
        </p>

        <fieldset className="answers" aria-label="Modulaciones">
          {moves.map((m, i) => {
            const state = answered && m === step.move ? "is-right" : answered && m === last?.chosen ? "is-wrong" : "";
            return (
              <button
                key={m}
                type="button"
                className={`answer ${state}`}
                onClick={() => answer(m)}
                disabled={answered}
                data-testid={`answer-${m}`}
              >
                <strong>{MOVES[m].label}</strong>
                <span className="meta">{MOVES[m].detail}</span>
                <kbd>{i + 1}</kbd>
              </button>
            );
          })}
        </fieldset>

        <PianoRoll
          notes={shown}
          steps={LOOP}
          lowMidi={clip.low - 12}
          highMidi={clip.low + 26}
          scale={scalePitchClasses(current.tonic, current.mode)}
          getPlayhead={getPlayhead}
          height={300}
        />
      </section>

      <section className="result" aria-live="polite">
        {feedback && (
          <p className={last?.correct ? "ok" : "ko"} data-testid="feedback">
            {feedback}
          </p>
        )}
        {answered && !finished && (
          <button type="button" className="primary" onClick={advance} data-testid="advance">
            Próximo cambio <kbd>Enter</kbd>
          </button>
        )}
        {finished && (
          <div data-testid="result">
            <strong className={passed ? "ok" : "ko"}>{Math.round(score * 100)}%</strong> <Stars earned={earned} />{" "}
            <span className="meta">
              {passed
                ? "¡Pasaste! El combo se nota: cuantos más aciertos seguidos, más vale cada uno."
                : "Todavía no. Escuchá el bajo en cada cambio: es lo primero que delata la tónica nueva."}
            </span>
            <button type="button" className="ghost" onClick={advance} data-testid="again">
              Otro run <kbd>Enter</kbd>
            </button>
            {passed && onNext && (
              <button type="button" className="ghost" onClick={onNext} data-testid="next">
                Siguiente nivel →
              </button>
            )}
          </div>
        )}
      </section>

      <DawCard id={level.dawCard} />
    </main>
  );
}
