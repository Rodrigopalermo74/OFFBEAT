import type { AudioEngine } from "@offbeat/audio-engine";
import { bestStreak, type MixRound, mixingRounds, scoreQuiz, stars } from "@offbeat/game-core";
import {
  type CamelotRelation,
  camelotCode,
  camelotOf,
  camelotRelation,
  type MixKey,
  mixKeyName,
  scaleDegrees,
  sharedNotes,
  wheelSteps,
} from "@offbeat/theory";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CamelotWheel } from "../../components/CamelotWheel.tsx";
import { DawCard } from "../../components/DawCard.tsx";
import { GameHeader } from "../../components/GameHeader.tsx";
import { Stars } from "../../components/Stars.tsx";
import type { MixLevel } from "../../levels.ts";
import { EAR_GROOVE } from "../../patterns.ts";
import { blendClip, deckBass } from "./clips.ts";

interface HarmonicMixingProps {
  level: MixLevel;
  engine: AudioEngine;
  best: number;
  onFinish(score: number): void;
  onExit(): void;
  onNext?: () => void;
}

const LOOP = 64;
const EAR_OPTIONS = [
  { value: 0, key: "1", label: "Funciona", detail: "Las dos cubiertas suenan en la misma tonalidad" },
  { value: 1, key: "2", label: "Choca", detail: "Aparecen notas que rozan" },
] as const;

/** `?seed=N` fija las rondas (para tests); si no, cada partida sale distinta. */
function initialSeed(): number {
  const param = new URLSearchParams(window.location.search).get("seed");
  return param !== null && Number.isFinite(Number(param)) ? Number(param) : Math.floor(Math.random() * 2 ** 31);
}
const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

const label = (key: MixKey, withCode = true) =>
  withCode ? `${mixKeyName(key)} (${camelotCode(key)})` : mixKeyName(key);

function relationText(a: MixKey, b: MixKey, relation: CamelotRelation): string {
  if (relation === "same") return "es la misma tonalidad";
  if (relation === "relative") return "son relativos: mismo número, otra letra";
  if (relation === "adjacent") {
    const up = wheelSteps(camelotOf(a).number, camelotOf(b).number) > 0;
    return `son vecinos en la rueda (${up ? "+1, una quinta arriba" : "−1, una quinta abajo"})`;
  }
  const steps = Math.abs(wheelSteps(camelotOf(a).number, camelotOf(b).number));
  return relation === "diagonal" ? "están en diagonal en la rueda" : `están a ${steps} pasos en la rueda`;
}

/** Qué notas cambian de una escala a la otra: "F por F#". */
function noteSwap(a: MixKey, b: MixKey): string {
  const na = scaleDegrees(a.tonic, a.mode);
  const nb = scaleDegrees(b.tonic, b.mode);
  const out = na.filter((x) => !nb.some((y) => y.pc === x.pc)).map((x) => x.name);
  const inn = nb.filter((y) => !na.some((x) => x.pc === y.pc)).map((y) => y.name);
  return out.length === 0 ? "" : `cambia ${out.join(", ")} por ${inn.join(", ")}`;
}

function explain(home: MixKey, other: MixKey): string {
  const relation = camelotRelation(home, other);
  const swap = noteSwap(home, other);
  return `${label(home)} y ${label(other)} ${relationText(home, other, relation)}. Comparten ${sharedNotes(home, other)} de 7 notas${swap ? `: ${swap}` : ""}.`;
}

/** Crossfader de adorno: lee la posición del transporte y dibuja (A sola, después A+B). */
function Crossfader({ getPlayhead }: { getPlayhead(): number | null }) {
  const thumb = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const pos = getPlayhead();
      const blend = pos !== null && pos % LOOP >= LOOP / 2;
      thumb.current?.classList.toggle("is-blend", blend);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [getPlayhead]);
  return (
    <div className="xfader" aria-hidden="true">
      <span>A</span>
      <span className="xfader__track">
        <span ref={thumb} className="xfader__thumb" />
      </span>
      <span>B</span>
    </div>
  );
}

export function HarmonicMixing({ level, engine, best, onFinish, onExit, onNext }: HarmonicMixingProps) {
  const target = level.target;
  const isEar = target.task === "ear";

  const [seed, setSeed] = useState(initialSeed);
  const rounds = useMemo<MixRound[]>(
    () =>
      mixingRounds(
        {
          task: target.task,
          rounds: target.rounds,
          homes: target.homes,
          relations: target.relations,
          candidates: target.candidates,
        },
        seed,
      ),
    [target, seed],
  );
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<{ chosen: number; correct: boolean }[]>([]);
  const [cued, setCued] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const round = rounds[index] as MixRound;
  const answered = answers.length > index;
  const finished = answers.length === target.rounds;
  const last = answers[index];
  const score = scoreQuiz(
    answers.map((a) => a.correct),
    target.rounds,
  );
  const showCodes = target.showCodes || answered;

  // Lo que suena en la cubierta B: en ear, la pareja de la ronda; en pick, el candidato cargado.
  const deckB: MixKey | null =
    round.task === "ear" ? round.other : cued !== null ? (round.candidates[cued] ?? null) : null;
  const right: MixKey = round.task === "ear" ? round.other : (round.candidates[round.answer] as MixKey);

  useEffect(() => {
    engine.setBpm(level.bpm);
    engine.setSwing(0.54);
    engine.setDrumPattern(EAR_GROOVE);
  }, [engine, level.bpm]);
  useEffect(() => engine.setPadClip(blendClip(round.home, deckB), LOOP), [engine, round.home, deckB]);
  useEffect(() => engine.setBassClip(deckBass(round.home, LOOP), LOOP), [engine, round.home]);
  useEffect(() => () => engine.stop(), [engine]);

  const togglePlay = useCallback(() => {
    if (playing) engine.stop();
    else engine.play();
    setPlaying(!playing);
  }, [engine, playing]);

  const answer = useCallback(
    (chosen: number) => {
      if (answered) return;
      const correct = round.task === "ear" ? (chosen === 0) === round.compatible : chosen === round.answer;
      const next = [...answers, { chosen, correct }];
      setAnswers(next);
      if (round.task === "pick") setCued(chosen);
      if (next.length === target.rounds) {
        onFinish(
          scoreQuiz(
            next.map((a) => a.correct),
            target.rounds,
          ),
        );
      }
    },
    [answered, answers, round, target.rounds, onFinish],
  );

  const advance = useCallback(() => {
    if (finished) {
      setSeed(randomSeed());
      setAnswers([]);
      setIndex(0);
      setCued(null);
    } else if (answered) {
      setIndex((i) => i + 1);
      setCued(null);
    } else if (!isEar && cued !== null) {
      answer(cued);
    }
  }, [finished, answered, isEar, cued, answer]);

  // Atajos: números para cargar la cubierta B (pick) o responder (ear), Enter mezcla o sigue, Esc sale.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1) {
        if (isEar && n <= 2) answer(n - 1);
        else if (round.task === "pick" && n <= round.candidates.length && !answered) setCued(n - 1);
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
  }, [isEar, round, answered, answer, togglePlay, advance, onExit]);

  const feedback = (() => {
    if (!last) return null;
    if (round.task === "ear") {
      const verdict = round.compatible ? "Funciona" : "Choca";
      return `${last.correct ? "✓" : "✗"} ${verdict}. ${explain(round.home, round.other)}`;
    }
    const chosen = round.candidates[last.chosen] as MixKey;
    if (last.correct) return `✓ ${explain(round.home, chosen)}`;
    return `✗ ${label(chosen)} choca: comparte solo ${sharedNotes(round.home, chosen)} de 7 notas con ${label(round.home)}. La que mezclaba era ${label(right)}: ${relationText(round.home, right, camelotRelation(round.home, right)).replace(/^son /, "")}.`;
  })();

  const passed = finished && score >= level.threshold;
  const earned = finished ? stars(score, level.threshold) : 0;
  const getPlayhead = useCallback(() => (playing ? engine.getPositionSteps() : null), [engine, playing]);
  const compare = answered
    ? round.task === "ear"
      ? round.other
      : (round.candidates[last?.chosen ?? 0] as MixKey)
    : null;

  return (
    <main className="app">
      <GameHeader level={level} best={best} onExit={onExit} detail={label(round.home, target.showCodes)} />

      <section>
        <div className="section-head">
          <button type="button" className="primary" onClick={togglePlay} data-testid="play">
            {playing ? "Stop" : "Play"} <kbd>Espacio</kbd>
          </button>
          <span className="meta" data-testid="round">
            Ronda {Math.min(index + 1, target.rounds)} de {target.rounds} · Racha{" "}
            {bestStreak(answers.map((a) => a.correct))}
          </span>
          <ol className="round-dots" aria-label="Resultados por ronda">
            {rounds.map((_, i) => {
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

        <div className="mix">
          <div className="mix__decks">
            <div className="decks">
              <div className="deck" data-testid="deck-a">
                <span className="eyebrow">Cubierta A</span>
                <strong className="deck__key">{mixKeyName(round.home)}</strong>
                <span className="deck__code">{target.showCodes ? camelotCode(round.home) : "··"}</span>
              </div>
              <Crossfader getPlayhead={getPlayhead} />
              <div className={`deck ${deckB ? "" : "is-empty"}`} data-testid="deck-b">
                <span className="eyebrow">Cubierta B</span>
                <strong className="deck__key">{deckB && (!isEar || answered) ? mixKeyName(deckB) : "??"}</strong>
                <span className="deck__code">
                  {deckB && showCodes && (!isEar || answered) ? camelotCode(deckB) : "··"}
                </span>
              </div>
            </div>

            <p className="hint">
              {isEar
                ? "Dos compases suena la cubierta A sola y dos con la B encima. ¿La mezcla funciona o choca?"
                : "Cargá un candidato en la cubierta B con su número y escuchá el blend: dos compases de A sola y dos con las dos. Cuando estés seguro, mezclá."}
            </p>

            <fieldset className="answers" aria-label={isEar ? "¿Funciona o choca?" : "Candidatos"}>
              {round.task === "ear"
                ? EAR_OPTIONS.map((o) => {
                    const truth = round.compatible ? 0 : 1;
                    const state =
                      answered && o.value === truth
                        ? "is-right"
                        : answered && o.value === last?.chosen
                          ? "is-wrong"
                          : "";
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
                  })
                : round.candidates.map((k, i) => {
                    const state =
                      answered && i === round.answer
                        ? "is-right"
                        : answered && i === last?.chosen
                          ? "is-wrong"
                          : cued === i
                            ? "is-cued"
                            : "";
                    return (
                      <button
                        key={camelotCode(k)}
                        type="button"
                        className={`answer ${state}`}
                        onClick={() => setCued(i)}
                        disabled={answered}
                        data-testid={`candidate-${i + 1}`}
                      >
                        <strong>{mixKeyName(k)}</strong>
                        <span className="meta">{showCodes ? camelotCode(k) : "Código oculto"}</span>
                        <kbd>{i + 1}</kbd>
                      </button>
                    );
                  })}
            </fieldset>
            {!isEar && !answered && (
              <button
                type="button"
                className="primary"
                onClick={() => cued !== null && answer(cued)}
                disabled={cued === null}
                data-testid="mix"
              >
                Mezclar {deckB ? mixKeyName(deckB) : ""} <kbd>Enter</kbd>
              </button>
            )}
          </div>

          <div className="mix__wheel">
            {showCodes ? (
              <CamelotWheel
                home={round.home}
                cued={deckB && (!isEar || answered) ? deckB : null}
                marked={round.task === "pick" && target.showCodes ? round.candidates : []}
                reveal={answered}
              />
            ) : (
              <p className="camelot-hidden">
                Rueda oculta.
                <br />
                Se muestra cuando respondés.
              </p>
            )}
          </div>
        </div>

        {compare && (
          <div className="scales" data-testid="scales">
            {[round.home, compare].map((k, row) => {
              const other = row === 0 ? compare : round.home;
              const theirs = new Set(scaleDegrees(other.tonic, other.mode).map((d) => d.pc));
              return (
                <div key={row === 0 ? "deck-a" : "deck-b"} className="scales__row">
                  <span className="eyebrow">{label(k)}</span>
                  {scaleDegrees(k.tonic, k.mode).map((d) => (
                    <span key={d.degree} className={`chip ${theirs.has(d.pc) ? "" : "is-off"}`}>
                      {d.name}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        )}
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
                : "Todavía no. Mirá en la rueda qué casilleros mezclaban y volvé a probar."}
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
