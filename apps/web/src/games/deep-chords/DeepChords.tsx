import type { AudioEngine } from "@offbeat/audio-engine";
import { analyzeBar, scoreStack, scoreVoiceLeading, stars } from "@offbeat/game-core";
import { chordVoicing, fromMidi, scalePitchClasses, toMidi, voiceLeadingCost } from "@offbeat/theory";
import { PianoRoll, type RollNote } from "@offbeat/ui-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DawCard } from "../../components/DawCard.tsx";
import { ExportMidi } from "../../components/ExportMidi.tsx";
import { type ChordLevel, MODE_LABELS, SCALE_NAMES } from "../../levels.ts";
import { STARTER_GROOVE } from "../../patterns.ts";

interface DeepChordsProps {
  level: ChordLevel;
  engine: AudioEngine;
  best: number;
  onFinish(score: number): void;
  onExit(): void;
  onNext?: () => void;
}

/** Un compás por acorde en pantalla (el loop suena igual que lo que se ve). */
const BAR = 16;

function initialNotes(level: ChordLevel): RollNote[] {
  if (level.mode === "stack") return [];
  // Voice leading arranca con todos los acordes en posición fundamental: suena a saltos, hay que suavizarlo.
  return level.target.progression.flatMap((symbol, bar) =>
    chordVoicing(symbol, 3).map((midi) => ({ midi, start: bar * BAR, length: BAR })),
  );
}

export function DeepChords({ level, engine, best, onFinish, onExit, onNext }: DeepChordsProps) {
  const { target } = level;
  const symbols = target.progression;
  const steps = symbols.length * BAR;
  const [low, high] = target.voicingRange.map(toMidi) as [number, number];
  const isStack = level.mode === "stack";

  const [notes, setNotes] = useState<RollNote[]>(() => initialNotes(level));
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);

  const bars = useMemo(
    () =>
      symbols.map((_, bar) =>
        notes
          .filter((n) => n.start === bar * BAR)
          .map((n) => n.midi)
          .sort((a, b) => a - b),
      ),
    [notes, symbols],
  );

  const evaluation = useMemo(() => {
    if (isStack) {
      const symbol = symbols[0] ?? "";
      const analyses = [analyzeBar(bars[0] ?? [], symbol, low, high)];
      return { score: scoreStack(bars[0] ?? [], symbol, low, high), analyses, cost: null };
    }
    const vl = scoreVoiceLeading(bars, symbols, target.optimalCost ?? 0, low, high);
    return { score: vl.score, analyses: vl.bars, cost: vl.cost };
  }, [isStack, bars, symbols, low, high, target.optimalCost]);

  useEffect(() => {
    engine.setBpm(level.bpm);
    engine.setSwing(0.54);
    engine.setDrumPattern(STARTER_GROOVE);
  }, [engine, level.bpm]);
  useEffect(() => engine.setPadClip(notes, steps), [engine, notes, steps]);
  useEffect(() => () => engine.stop(), [engine]);

  const togglePlay = useCallback(() => {
    if (playing) engine.stop();
    else engine.play();
    setPlaying(!playing);
  }, [engine, playing]);

  const drop = useCallback(() => {
    setResult(evaluation.score);
    setAttempts((a) => a + 1);
    onFinish(evaluation.score);
  }, [evaluation.score, onFinish]);

  const reset = useCallback(() => {
    setResult(null);
    setNotes(initialNotes(level));
  }, [level]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "Enter") {
        e.preventDefault();
        drop();
      } else if (e.key === "Backspace" && (e.ctrlKey || e.metaKey)) {
        reset();
      } else if (e.key === "Escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, drop, reset, onExit]);

  const edit = (next: RollNote[]) => {
    setResult(null);
    setNotes(next);
  };

  const passed = result !== null && result >= level.threshold;
  const earned = result !== null ? stars(result, level.threshold) : 0;
  const getPlayhead = useCallback(() => (playing ? engine.getPositionSteps() : null), [engine, playing]);

  return (
    <main className="app">
      <header className="transport">
        <button type="button" className="ghost" onClick={onExit}>
          ← Mapa
        </button>
        <div>
          <span className="meta">
            {MODE_LABELS[level.mode]} · Capítulo {level.chapter} · {level.bpm} BPM
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
          <button type="button" className="ghost" onClick={reset} data-testid="reset">
            Empezar de nuevo <kbd>Ctrl+⌫</kbd>
          </button>
          {!isStack && (
            <span className="meta" data-testid="movement">
              Movimiento: {evaluation.cost ?? "—"} semitonos · Meta: {target.optimalCost}
            </span>
          )}
        </div>

        <div className="bars" style={{ gridTemplateColumns: `repeat(${symbols.length}, 1fr)` }}>
          {symbols.map((symbol, i) => {
            const analysis = evaluation.analyses[i];
            const prev = bars[i - 1];
            const current = bars[i] ?? [];
            const step =
              !isStack && i > 0 && prev && analysis?.valid && evaluation.analyses[i - 1]?.valid
                ? voiceLeadingCost(prev, current)
                : null;
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: un encabezado por compás
              <div key={i} className="bar-head" data-testid={`bar-${i}`}>
                <strong>{symbol}</strong>
                {step !== null && <span className="meta">{step} semitonos desde el anterior</span>}
                <div className={analysis?.valid ? "ok" : "meta"}>
                  {analysis?.valid
                    ? `✓ ${current.map((m) => fromMidi(m)).join(" ")}`
                    : [
                        analysis?.missing.length ? `Falta: ${analysis.missing.join(", ")}` : "",
                        analysis?.extra.length ? `Sobra: ${analysis.extra.join(", ")}` : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                </div>
              </div>
            );
          })}
        </div>

        <PianoRoll
          notes={notes}
          steps={steps}
          lowMidi={low}
          highMidi={high}
          scale={scalePitchClasses(level.key.tonic, level.key.mode)}
          getPlayhead={getPlayhead}
          onChange={edit}
          snapSteps={BAR}
          height={380}
        />
        <p className="hint">
          Click en una fila para agregar una nota que dura todo el compás; click sobre una nota para quitarla. Las filas
          resaltadas son la escala de {level.key.tonic} {SCALE_NAMES[level.key.mode] ?? level.key.mode}.
        </p>
      </section>

      <section className="result" aria-live="polite">
        <button type="button" className="primary" onClick={drop} data-testid="drop">
          Drop <kbd>Enter</kbd>
        </button>
        <ExportMidi
          name={level.id}
          isEmpty={notes.length === 0}
          song={() => ({ bpm: level.bpm, tracks: [{ name: "Pad", channel: 1, notes }] })}
        />
        {result !== null && (
          <div data-testid="result">
            <strong className={passed ? "ok" : "ko"}>{Math.round(result * 100)}%</strong>{" "}
            <span role="img" aria-label={`${earned} de 3 estrellas`}>
              {"★".repeat(earned) + "☆".repeat(3 - earned)}
            </span>{" "}
            <span className="meta">
              {passed
                ? "¡Pasaste! El próximo nivel quedó desbloqueado."
                : isStack
                  ? "Todavía no. Revisá qué notas faltan o sobran."
                  : "Todavía no. Buscá inversiones que dejen quietas las notas en común."}{" "}
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
