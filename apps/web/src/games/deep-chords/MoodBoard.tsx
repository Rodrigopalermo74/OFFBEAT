import type { AudioEngine, NoteClip } from "@offbeat/audio-engine";
import {
  evaluateMoodBoard,
  type HarmonicFunction,
  harmonicFunction,
  type MoodCheck,
  stars,
  TENSION,
} from "@offbeat/game-core";
import { chordTones, romanNumeral, scalePitchClasses, smoothVoicing, toMidi } from "@offbeat/theory";
import { PianoRoll } from "@offbeat/ui-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type ChordLevel, MODE_LABELS, SCALE_NAMES } from "../../levels.ts";
import { STARTER_GROOVE } from "../../patterns.ts";

interface MoodBoardProps {
  level: ChordLevel;
  engine: AudioEngine;
  best: number;
  onFinish(score: number): void;
  onExit(): void;
  onNext?: () => void;
}

const BAR = 16;

const FN_NAMES: Record<HarmonicFunction, string> = { T: "Tónica", PD: "Predominante", D: "Dominante" };
const FN_ARTICLE: Record<HarmonicFunction, string> = { T: "la tónica", PD: "un predominante", D: "un dominante" };

function describe(check: MoodCheck, bars: number, roman: (c: string) => string): string {
  switch (check.type) {
    case "complete":
      return `Completá los ${bars} compases`;
    case "start":
      return `Arrancá en ${FN_ARTICLE[check.fn]}`;
    case "end":
      return `Terminá en ${FN_ARTICLE[check.fn]}`;
    case "includes":
      return `Usá ${check.chord} (${roman(check.chord)})`;
    case "cadence":
      return `Pasá de ${FN_ARTICLE[check.from]} a ${FN_ARTICLE[check.to]} (cuenta la vuelta del loop)`;
    case "distinct":
      return `Usá al menos ${check.min} acordes distintos`;
    case "no-repeat":
      return "No repitas el mismo acorde dos compases seguidos (tampoco al volver al principio)";
  }
}

/** Fundamental del acorde en la octava 2, para el bajo automático. */
function bassRoot(symbol: string): number {
  return toMidi(`${chordTones(symbol)[0]?.name}2`);
}

export function MoodBoard({ level, engine, best, onFinish, onExit, onNext }: MoodBoardProps) {
  const { target, key } = level;
  const pads = target.pads ?? [];
  const checks = (target.checks ?? []) as MoodCheck[];
  const bars = target.progression.length;
  const [low, high] = target.voicingRange.map(toMidi) as [number, number];
  const roman = useCallback((c: string) => romanNumeral(c, key.tonic, key.mode) ?? c, [key]);

  const [slots, setSlots] = useState<(string | null)[]>(() => new Array(bars).fill(null));
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);

  const evaluation = useMemo(() => evaluateMoodBoard(slots, key, checks), [slots, key, checks]);

  // Voicings ligados compás a compás, como los tocaría un tecladista.
  const voicings = useMemo(() => {
    let prev: number[] | null = null;
    return slots.map((symbol) => {
      if (!symbol) return null;
      prev = smoothVoicing(prev, symbol, low, high);
      return prev;
    });
  }, [slots, low, high]);

  const padNotes = useMemo<NoteClip[]>(
    () => voicings.flatMap((v, bar) => (v ?? []).map((midi) => ({ midi, start: bar * BAR, length: BAR }))),
    [voicings],
  );

  useEffect(() => {
    engine.setBpm(level.bpm);
    engine.setSwing(0.54);
    engine.setDrumPattern(STARTER_GROOVE);
  }, [engine, level.bpm]);
  useEffect(() => {
    const bass = slots.flatMap((symbol, bar) =>
      symbol ? [2, 6, 10, 14].map((step) => ({ midi: bassRoot(symbol), start: bar * BAR + step, length: 2 })) : [],
    );
    engine.setPadClip(padNotes, bars * BAR);
    engine.setBassClip(bass, bars * BAR);
  }, [engine, padNotes, slots, bars]);
  useEffect(
    () => () => {
      engine.stop();
      engine.setBassClip([], BAR);
    },
    [engine],
  );

  const togglePlay = useCallback(() => {
    if (playing) engine.stop();
    else engine.play();
    setPlaying(!playing);
  }, [engine, playing]);

  const place = useCallback(
    (chord: string) => {
      setResult(null);
      setSlots((prev) => prev.map((c, i) => (i === selected ? chord : c)));
      setSelected((s) => (s + 1) % bars);
    },
    [selected, bars],
  );

  const clear = useCallback(() => {
    setResult(null);
    setSlots((prev) => prev.map((c, i) => (i === selected ? null : c)));
  }, [selected]);

  const drop = useCallback(() => {
    setResult(evaluation.score);
    setAttempts((a) => a + 1);
    onFinish(evaluation.score);
  }, [evaluation.score, onFinish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const pad = pads[Number(e.key) - 1];
      if (pad && /^[1-8]$/.test(e.key)) {
        place(pad);
      } else if (e.key === "ArrowLeft") {
        setSelected((s) => (s - 1 + bars) % bars);
      } else if (e.key === "ArrowRight") {
        setSelected((s) => (s + 1) % bars);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        clear();
      } else if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "Enter") {
        e.preventDefault();
        drop();
      } else if (e.key === "Escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pads, bars, place, clear, togglePlay, drop, onExit]);

  const passed = result !== null && result >= level.threshold;
  const earned = result !== null ? stars(result, level.threshold) : 0;
  const getPlayhead = useCallback(() => (playing ? engine.getPositionSteps() : null), [engine, playing]);
  const fnOf = (c: string | null) => (c ? harmonicFunction(c, key) : null);

  return (
    <main className="app">
      <header className="transport">
        <button type="button" className="ghost" onClick={onExit}>
          ← Mapa
        </button>
        <div>
          <span className="meta">
            {MODE_LABELS[level.mode]} · Capítulo {level.chapter} · {level.bpm} BPM · {key.tonic}{" "}
            {SCALE_NAMES[key.mode] ?? key.mode}
          </span>
          <h1 className="level-title">{level.title}</h1>
        </div>
        <span className="meta push-right">Mejor: {Math.round(best * 100)}%</span>
      </header>

      <p className="brief">{level.brief}</p>

      <section>
        <div className="section-head">
          <button type="button" className="primary" onClick={togglePlay} data-testid="play">
            {playing ? "Stop" : "Play"} <kbd>Espacio</kbd>
          </button>
          <span className="meta">
            <kbd>←</kbd> <kbd>→</kbd> elegís compás · <kbd>⌫</kbd> lo vacía
          </span>
        </div>

        <ol className="slots" style={{ gridTemplateColumns: `repeat(${bars}, 1fr)` }}>
          {slots.map((chord, i) => {
            const fn = fnOf(chord);
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: un casillero por compás
              <li key={i}>
                <button
                  type="button"
                  className={`slot ${i === selected ? "is-selected" : ""} ${fn ? `fn-${fn}` : ""}`}
                  onClick={() => setSelected(i)}
                  aria-pressed={i === selected}
                  data-testid={`slot-${i}`}
                >
                  <span className="meta">Compás {i + 1}</span>
                  <strong>{chord ?? "—"}</strong>
                  <span>{chord ? `${roman(chord)} · ${fn ? FN_NAMES[fn] : ""}` : "Elegí un pad"}</span>
                  <span className="tension" aria-hidden="true">
                    <span style={{ width: `${fn ? ((TENSION[fn] + 1) / 3) * 100 : 0}%` }} />
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <fieldset className="pads" aria-label="Pads de acordes">
          {pads.map((chord, i) => {
            const fn = fnOf(chord);
            return (
              <button
                key={chord}
                type="button"
                className={`pad ${fn ? `fn-${fn}` : ""}`}
                onClick={() => place(chord)}
                data-testid={`pad-${chord}`}
              >
                <strong>{roman(chord)}</strong>
                <span>{chord}</span>
                <kbd>{i + 1}</kbd>
              </button>
            );
          })}
        </fieldset>

        <PianoRoll
          notes={padNotes}
          steps={bars * BAR}
          lowMidi={low}
          highMidi={high}
          scale={scalePitchClasses(key.tonic, key.mode)}
          getPlayhead={getPlayhead}
          height={220}
        />
      </section>

      <section>
        <h2>El brief</h2>
        <ul className="checks" data-testid="checks">
          {evaluation.results.map(({ check, ok }) => (
            <li key={JSON.stringify(check)} className={ok ? "ok" : ""}>
              {ok ? "✓" : "○"} {describe(check, bars, roman)}
            </li>
          ))}
        </ul>
      </section>

      <section className="result" aria-live="polite">
        <button type="button" className="primary" onClick={drop} data-testid="drop">
          Drop <kbd>Enter</kbd>
        </button>
        {result !== null && (
          <div data-testid="result">
            <strong className={passed ? "ok" : "ko"}>{Math.round(result * 100)}%</strong>{" "}
            <span role="img" aria-label={`${earned} de 3 estrellas`}>
              {"★".repeat(earned) + "☆".repeat(3 - earned)}
            </span>{" "}
            <span className="meta">
              {passed
                ? "¡Pasaste! El próximo nivel quedó desbloqueado."
                : "Todavía no. Revisá los puntos del brief que siguen vacíos."}{" "}
              Intento {attempts}.
            </span>
            {passed && onNext && (
              <button type="button" className="ghost" onClick={onNext} data-testid="next">
                Siguiente nivel →
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
