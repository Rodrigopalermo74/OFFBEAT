import type { AudioEngine, NoteClip } from "@offbeat/audio-engine";
import { bestStreak, questionSequence, scoreQuiz, stars } from "@offbeat/game-core";
import { degreeMidi, modeDiff, scaleDegrees, scalePitchClasses } from "@offbeat/theory";
import { PianoRoll } from "@offbeat/ui-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DawCard } from "../../components/DawCard.tsx";
import { GameHeader } from "../../components/GameHeader.tsx";
import { Stars } from "../../components/Stars.tsx";
import { type KeyLevel, SCALE_NAMES } from "../../levels.ts";
import { EAR_GROOVE } from "../../patterns.ts";
import { droneClip, rootClip, swapClip } from "./clips.ts";

interface KeyShiftProps {
  level: KeyLevel;
  engine: AudioEngine;
  best: number;
  onFinish(score: number): void;
  onExit(): void;
  onNext?: () => void;
}

interface Option {
  value: string;
  /** Tecla que la elige. */
  key: string;
  label: string;
  detail: string;
}

/** `?seed=N` fija las preguntas (para tests); si no, cada partida sale distinta. */
function initialSeed(): number {
  const param = new URLSearchParams(window.location.search).get("seed");
  return param !== null && Number.isFinite(Number(param)) ? Number(param) : Math.floor(Math.random() * 2 ** 31);
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

export function KeyShift({ level, engine, best, onFinish, onExit, onNext }: KeyShiftProps) {
  const { tonic, mode: home } = level.key;
  const { rounds } = level.target;
  const isRoot = level.mode === "find-the-root";
  const homeName = `${tonic} ${SCALE_NAMES[home] ?? home}`;

  const degrees = useMemo(() => scaleDegrees(tonic, home), [tonic, home]);
  const options = useMemo<Option[]>(() => {
    if (isRoot) {
      return (level.target.degrees ?? []).map((d) => {
        const info = degrees[d - 1];
        return { value: String(d), key: String(d), label: info?.label ?? String(d), detail: info?.name ?? "" };
      });
    }
    return (level.target.modes ?? []).map((m, i) => {
      const diff = modeDiff(tonic, home, m);
      return {
        value: m,
        key: String(i + 1),
        label: capitalize(SCALE_NAMES[m] ?? m),
        detail: `${diff.map((c) => c.to.label).join(" y ")} en vez de ${diff.map((c) => c.from.label).join(" y ")}`,
      };
    });
  }, [isRoot, level.target, degrees, tonic, home]);

  const [seed, setSeed] = useState(initialSeed);
  const questions = useMemo(
    () =>
      questionSequence(
        options.map((o) => o.value),
        rounds,
        seed,
      ),
    [options, rounds, seed],
  );
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<{ chosen: string; correct: boolean }[]>([]);
  const [playing, setPlaying] = useState(false);

  const current = questions[index] ?? "";
  const answered = answers.length > index;
  const finished = answers.length === rounds;
  const score = scoreQuiz(
    answers.map((a) => a.correct),
    rounds,
  );

  const clip = useMemo(() => {
    if (isRoot) return { all: rootClip(tonic, home, Number(current)), visible: droneClip(tonic, home, 0, 16) };
    const { home: first, swap } = swapClip(tonic, home, current);
    return { all: [...first, ...swap], visible: first };
  }, [isRoot, tonic, home, current]);
  const steps = isRoot ? 16 : 64;
  const shown: NoteClip[] = answered ? clip.all : clip.visible;

  useEffect(() => {
    engine.setBpm(level.bpm);
    engine.setSwing(0.54);
    engine.setDrumPattern(EAR_GROOVE);
  }, [engine, level.bpm]);
  useEffect(() => engine.setPadClip(clip.all, steps), [engine, clip, steps]);
  useEffect(() => () => engine.stop(), [engine]);

  const togglePlay = useCallback(() => {
    if (playing) engine.stop();
    else engine.play();
    setPlaying(!playing);
  }, [engine, playing]);

  const answer = useCallback(
    (value: string) => {
      if (answered) return;
      const next = [...answers, { chosen: value, correct: value === current }];
      setAnswers(next);
      if (next.length === rounds) {
        onFinish(
          scoreQuiz(
            next.map((a) => a.correct),
            rounds,
          ),
        );
      }
    },
    [answered, answers, current, rounds, onFinish],
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

  // Atajos: números para responder, espacio, Enter para seguir, Esc para salir.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const option = options.find((o) => o.key === e.key);
      if (option) {
        answer(option.value);
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
  }, [options, answer, togglePlay, advance, onExit]);

  const last = answers[index];
  const feedback = (() => {
    if (!last) return null;
    if (isRoot) {
      const want = degrees[Number(current) - 1];
      const got = degrees[Number(last.chosen) - 1];
      return last.correct
        ? `✓ Era la ${want?.label} (${want?.name}).`
        : `✗ Era la ${want?.label} (${want?.name}), no la ${got?.label}. Escuchala ahora que sabés cuál es.`;
    }
    const changes = modeDiff(tonic, home, current)
      .map((c) => `la ${c.degree}ª pasó de ${c.from.name} a ${c.to.name}`)
      .join(" y ");
    const name = SCALE_NAMES[current] ?? current;
    return last.correct
      ? `✓ ${capitalize(name)}: ${changes}.`
      : `✗ Era ${name}, no ${SCALE_NAMES[last.chosen] ?? last.chosen}: ${changes}.`;
  })();

  const passed = finished && score >= level.threshold;
  const earned = finished ? stars(score, level.threshold) : 0;
  const getPlayhead = useCallback(() => (playing ? engine.getPositionSteps() : null), [engine, playing]);
  const low = degreeMidi(tonic, home, 1, 3);

  return (
    <main className="app">
      <GameHeader level={level} best={best} onExit={onExit} detail={homeName} />

      <section>
        <div className="section-head">
          <button type="button" className="primary" onClick={togglePlay} data-testid="play">
            {playing ? "Stop" : "Play"} <kbd>Espacio</kbd>
          </button>
          <span className="meta" data-testid="round">
            Ronda {Math.min(index + 1, rounds)} de {rounds} · Racha {bestStreak(answers.map((a) => a.correct))}
          </span>
          <ol className="round-dots" aria-label="Resultados por ronda">
            {questions.map((_, i) => {
              const a = answers[i];
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: una marca por ronda
                <li key={i} className={a ? (a.correct ? "ok" : "ko") : i === index ? "is-current" : ""}>
                  {a ? (a.correct ? "✓" : "✗") : "·"}
                </li>
              );
            })}
          </ol>
        </div>

        <p className="hint">
          {isRoot
            ? `Suena el acorde de ${homeName} y una nota encima. ¿Qué grado es? Las filas resaltadas son la escala.`
            : `Los dos primeros compases están en ${homeName}; los dos siguientes, en otro modo con la misma tónica. ¿Cuál?`}
        </p>

        <fieldset className="answers" aria-label={isRoot ? "Grados" : "Modos"}>
          {options.map((o) => {
            const state =
              answered && o.value === current ? "is-right" : answered && o.value === last?.chosen ? "is-wrong" : "";
            return (
              <button
                key={o.value}
                type="button"
                className={`answer ${state}`}
                onClick={() => answer(o.value)}
                disabled={answered}
                data-testid={`answer-${o.value}`}
              >
                <strong>{o.label}</strong>
                <span className="meta">{o.detail}</span>
                <kbd>{o.key}</kbd>
              </button>
            );
          })}
        </fieldset>

        <PianoRoll
          notes={shown}
          steps={steps}
          lowMidi={low}
          highMidi={low + 24}
          scale={scalePitchClasses(tonic, home)}
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
            Siguiente <kbd>Enter</kbd>
          </button>
        )}
        {finished && (
          <div data-testid="result">
            <strong className={passed ? "ok" : "ko"}>{Math.round(score * 100)}%</strong> <Stars earned={earned} />{" "}
            <span className="meta">
              {passed
                ? "¡Pasaste! El próximo nivel quedó desbloqueado."
                : "Todavía no. Escuchá cada respuesta correcta antes de seguir: así se fija el oído."}
            </span>
            <button type="button" className="ghost" onClick={advance} data-testid="again">
              Otra vez <kbd>Enter</kbd>
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
