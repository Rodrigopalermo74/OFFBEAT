import { type AudioEngine, DRUM_VOICES, type DrumPattern } from "@offbeat/audio-engine";
import { crowdMood, type Grid, scoreFix, scoreRecreate, stars } from "@offbeat/game-core";
import { chordVoicing } from "@offbeat/theory";
import { type CellMark, StepSequencer } from "@offbeat/ui-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DawCard } from "../../components/DawCard.tsx";
import { ExportMidi } from "../../components/ExportMidi.tsx";
import { GameHeader } from "../../components/GameHeader.tsx";
import { Stars } from "../../components/Stars.tsx";
import { GM_DRUMS, swungStart } from "../../exportMidi.ts";
import type { GrooveLevel } from "../../levels.ts";
import { VOICE_LABELS } from "../../patterns.ts";

interface GrooveLabProps {
  level: GrooveLevel;
  engine: AudioEngine;
  best: number;
  onFinish(score: number): void;
  onExit(): void;
  onNext?: () => void;
}

type Source = "reference" | "mine";

/** Ciclo de velocities al hacer click en Fix the Groove: fuerte → media → ghost → fuerte. */
const VELOCITY_CYCLE: Record<string, number> = { "1": 0.7, "0.7": 0.4, "0.4": 1 };

const MOOD_LABELS = {
  vacia: "La pista está vacía",
  calentando: "La pista se está calentando",
  arriba: "La pista está arriba",
  explota: "¡La pista explota!",
} as const;

/** El pad de fondo: un Am9 sostenido para que el ejercicio suene a track desde el primer segundo. */
const PAD = chordVoicing("Am9", 3).map((midi) => ({ midi, start: 0, length: 16 }));

function toPattern(tracks: Grid, steps: number): DrumPattern {
  return Object.fromEntries(
    DRUM_VOICES.map((voice) => [voice, tracks[voice] ?? new Array<number>(steps).fill(0)]),
  ) as DrumPattern;
}

function initialTracks(level: GrooveLevel): Grid {
  if (level.mode === "fix" && level.target.start) return { ...level.target.start.tracks } as Grid;
  return Object.fromEntries(
    Object.keys(level.target.tracks).map((voice) => [voice, new Array<number>(level.target.steps).fill(0)]),
  );
}

export function GrooveLab({ level, engine, best, onFinish, onExit, onNext }: GrooveLabProps) {
  const { target } = level;
  const targetTracks = target.tracks as Grid;
  const isFix = level.mode === "fix";
  const voices = DRUM_VOICES.filter((v) => v in targetTracks);

  const [tracks, setTracks] = useState<Grid>(() => initialTracks(level));
  const [swing, setSwing] = useState(isFix && target.start ? target.start.swing : 0.5);
  const [source, setSource] = useState<Source>("reference");
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [result, setResult] = useState<{ score: number; marks: Record<string, (CellMark | undefined)[]> } | null>(null);
  const [attempts, setAttempts] = useState(0);

  const liveScore = useMemo(
    () =>
      isFix
        ? scoreFix({ swing: target.swing, tracks: targetTracks }, { swing, tracks }, level.bpm, level.scoring.windowMs)
        : scoreRecreate(targetTracks, tracks),
    [isFix, target.swing, targetTracks, swing, tracks, level.bpm, level.scoring.windowMs],
  );

  // El motor toca la referencia o la versión del jugador; cambiar de fuente no corta el loop.
  useEffect(() => {
    engine.setBpm(level.bpm);
    engine.setPadClip(PAD, 16);
  }, [engine, level.bpm]);
  useEffect(() => {
    const ref = source === "reference";
    engine.setDrumPattern(toPattern(ref ? targetTracks : tracks, target.steps));
    engine.setSwing(ref ? target.swing : swing);
  }, [engine, source, targetTracks, tracks, target.steps, target.swing, swing]);
  useEffect(() => () => engine.stop(), [engine]);

  // Playhead: solo lectura de la posición del transporte para dibujar.
  useEffect(() => {
    if (!playing) {
      setCurrentStep(null);
      return;
    }
    let frame = 0;
    const tick = () => {
      setCurrentStep(Math.floor(engine.getPositionSteps()) % target.steps);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [engine, playing, target.steps]);

  const togglePlay = useCallback(() => {
    if (playing) engine.stop();
    else engine.play();
    setPlaying(!playing);
  }, [engine, playing]);

  const toggleSource = useCallback(() => setSource((s) => (s === "reference" ? "mine" : "reference")), []);

  const drop = useCallback(() => {
    const marks: Record<string, (CellMark | undefined)[]> = {};
    if (!isFix) {
      for (const voice of voices) {
        marks[voice] = (targetTracks[voice] ?? []).map((want, i) => {
          const has = (tracks[voice]?.[i] ?? 0) > 0;
          return want > 0 && !has ? "missed" : has && want <= 0 ? "extra" : undefined;
        });
      }
    }
    setResult({ score: liveScore, marks });
    setAttempts((a) => a + 1);
    onFinish(liveScore);
  }, [isFix, voices, targetTracks, tracks, liveScore, onFinish]);

  // Atajos de teclado (es una app de escritorio): espacio, R, Enter, Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type !== "range") return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "r" || e.key === "R") {
        toggleSource();
      } else if (e.key === "Enter") {
        e.preventDefault();
        drop();
      } else if (e.key === "Escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, toggleSource, drop, onExit]);

  const edit = (voice: string, step: number) => {
    setResult(null);
    setSource("mine");
    setTracks((prev) => {
      const row = [...(prev[voice] ?? [])];
      const v = row[step] ?? 0;
      row[step] = isFix ? (VELOCITY_CYCLE[String(v)] ?? v) : v > 0 ? 0 : 1;
      return { ...prev, [voice]: row };
    });
  };

  const changeSwing = (value: number) => {
    setResult(null);
    setSource("mine");
    setSwing(value);
  };

  const showingReference = source === "reference";
  const passed = result !== null && result.score >= level.threshold;
  const earned = result ? stars(result.score, level.threshold) : 0;

  return (
    <main className="app">
      <GameHeader level={level} best={best} onExit={onExit} />

      <section>
        <div className="section-head">
          <button type="button" className="primary" onClick={togglePlay} data-testid="play">
            {playing ? "Stop" : "Play"} <kbd>Espacio</kbd>
          </button>
          <div className="segmented">
            <button
              type="button"
              aria-pressed={showingReference}
              className={showingReference ? "is-active" : ""}
              onClick={() => setSource("reference")}
              data-testid="source-reference"
            >
              Referencia
            </button>
            <button
              type="button"
              aria-pressed={!showingReference}
              className={!showingReference ? "is-active" : ""}
              onClick={() => setSource("mine")}
              data-testid="source-mine"
            >
              Tu versión
            </button>
          </div>
          <span className="meta">
            <kbd>R</kbd> alterna
          </span>
          {isFix && (
            <label className="swing">
              Swing {Math.round(swing * 100)}%
              <input
                type="range"
                min={0.5}
                max={0.75}
                step={0.01}
                value={swing}
                onChange={(e) => changeSwing(Number(e.target.value))}
                data-testid="swing"
              />
            </label>
          )}
        </div>

        <p className="hint" data-testid="source-hint">
          {showingReference
            ? "Suena la referencia. El patrón no se muestra: sacalo de oído. Al editar pasás a tu versión."
            : "Suena tu versión."}
        </p>
        <StepSequencer
          voices={voices}
          labels={VOICE_LABELS}
          pattern={tracks}
          currentStep={currentStep}
          onToggle={edit}
          isDisabled={isFix ? (voice, step) => (targetTracks[voice]?.[step] ?? 0) <= 0 : undefined}
          mark={result ? (voice, step) => result.marks[voice]?.[step] : undefined}
        />
        {isFix && <p className="hint">Click en un golpe para cambiar su velocity: fuerte → media → ghost.</p>}
      </section>

      {isFix && (
        <section className="crowd" aria-live="polite">
          <h2>Crowd energy</h2>
          <div className="meter" data-testid="energy">
            <div className="meter__fill" style={{ width: `${Math.round(liveScore * 100)}%` }} />
          </div>
          <span className="meta">{MOOD_LABELS[crowdMood(liveScore)]}</span>
        </section>
      )}

      <section className="result" aria-live="polite">
        <button type="button" className="primary" onClick={drop} data-testid="drop">
          Drop <kbd>Enter</kbd>
        </button>
        <ExportMidi
          name={level.id}
          isEmpty={!Object.values(tracks).some((row) => row?.some((v) => v > 0))}
          song={() => ({
            bpm: level.bpm,
            tracks: [
              {
                name: "Drums",
                channel: 10,
                notes: Object.entries(tracks).flatMap(([voice, row]) =>
                  (row ?? []).flatMap((velocity, step) =>
                    velocity > 0
                      ? [{ midi: GM_DRUMS[voice] ?? 36, start: swungStart(step, swing), length: 1, velocity }]
                      : [],
                  ),
                ),
              },
            ],
          })}
        />
        {result && (
          <div data-testid="result">
            <strong className={passed ? "ok" : "ko"}>{Math.round(result.score * 100)}%</strong>{" "}
            <Stars earned={earned} />{" "}
            <span className="meta">
              {passed
                ? "¡Pasaste! El próximo nivel quedó desbloqueado."
                : isFix
                  ? "Todavía no. Compará con la referencia y ajustá el feel."
                  : "Todavía no. Las marcas muestran golpes que faltan (borde) y que sobran (tachados)."}{" "}
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

      <DawCard id={level.dawCard} />
    </main>
  );
}
