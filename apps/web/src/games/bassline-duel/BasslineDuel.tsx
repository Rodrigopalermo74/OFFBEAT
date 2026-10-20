import type { AudioEngine, NoteClip } from "@offbeat/audio-engine";
import { analyzeBassline, type BasslineAnalysis, scoreBassline, stars } from "@offbeat/game-core";
import { chordVoicing, fromMidi, scalePitchClasses, toMidi } from "@offbeat/theory";
import { PianoRoll, type RollNote } from "@offbeat/ui-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DawCard } from "../../components/DawCard.tsx";
import { ExportMidi } from "../../components/ExportMidi.tsx";
import { type BassLevel, MODE_LABELS, SCALE_NAMES } from "../../levels.ts";
import { STARTER_GROOVE } from "../../patterns.ts";

interface BasslineDuelProps {
  level: BassLevel;
  engine: AudioEngine;
  best: number;
  onFinish(score: number): void;
  onExit(): void;
  onNext?: () => void;
}

/** "duel": compás 1 la máquina (llamada), compás 2 vos (respuesta). "call": solo la llamada en loop. */
type Listen = "duel" | "call";

const BAR = 16;

/** Duraciones que se eligen con las teclas 1, 2 y 3. */
const LENGTHS = [
  { key: "1", steps: 1, label: "1/16" },
  { key: "2", steps: 2, label: "1/8" },
  { key: "3", steps: 4, label: "1/4" },
];

/** Un acorde de la tónica muy bajito de fondo, para que el oído tenga dónde pararse. */
function padFor(level: BassLevel, loop: number): NoteClip[] {
  const symbol = `${level.key.tonic}${level.key.mode === "minor" ? "m" : ""}`;
  return chordVoicing(symbol, 3).map((midi) => ({ midi, start: 0, length: loop }));
}

export function BasslineDuel({ level, engine, best, onFinish, onExit, onNext }: BasslineDuelProps) {
  const { target } = level;
  const [low, high] = target.range.map(toMidi) as [number, number];
  const call = useMemo(
    () => target.notes.map((n) => ({ midi: toMidi(n.note), start: n.start, length: n.length })),
    [target.notes],
  );

  const [notes, setNotes] = useState<RollNote[]>([]);
  const [listen, setListen] = useState<Listen>("duel");
  const [length, setLength] = useState(2);
  const [playing, setPlaying] = useState(false);
  const [half, setHalf] = useState<"call" | "response">("call");
  const [result, setResult] = useState<{ score: number; analysis: BasslineAnalysis } | null>(null);
  const [attempts, setAttempts] = useState(0);

  const loop = listen === "duel" ? 2 * BAR : BAR;
  useEffect(() => {
    engine.setBpm(level.bpm);
    engine.setSwing(0.52);
    engine.setDrumPattern(STARTER_GROOVE);
  }, [engine, level.bpm]);
  useEffect(() => {
    const response = listen === "duel" ? notes.map((n) => ({ ...n, start: n.start + BAR })) : [];
    engine.setBassClip([...call, ...response], loop);
    engine.setPadClip(padFor(level, loop), loop);
  }, [engine, call, notes, listen, loop, level]);
  useEffect(
    () => () => {
      engine.stop();
      engine.setBassClip([], BAR);
    },
    [engine],
  );

  // Solo lectura de la posición para saber qué mitad del duelo está sonando.
  useEffect(() => {
    if (!playing || listen === "call") {
      setHalf("call");
      return;
    }
    let frame = 0;
    const tick = () => {
      setHalf(Math.floor(engine.getPositionSteps() / BAR) % 2 === 0 ? "call" : "response");
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [engine, playing, listen]);

  const togglePlay = useCallback(() => {
    if (playing) engine.stop();
    else engine.play();
    setPlaying(!playing);
  }, [engine, playing]);

  const toggleListen = useCallback(() => setListen((l) => (l === "duel" ? "call" : "duel")), []);

  const drop = useCallback(() => {
    const score = scoreBassline(call, notes);
    setResult({ score, analysis: analyzeBassline(call, notes) });
    setAttempts((a) => a + 1);
    onFinish(score);
  }, [call, notes, onFinish]);

  const reset = useCallback(() => {
    setResult(null);
    setNotes([]);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const len = LENGTHS.find((l) => l.key === e.key);
      if (len) {
        setLength(len.steps);
      } else if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "r" || e.key === "R") {
        toggleListen();
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
  }, [togglePlay, toggleListen, drop, reset, onExit]);

  // El bajo es monofónico: una nota nueva reemplaza a la que arrancaba en el mismo paso.
  const edit = (next: RollNote[]) => {
    setResult(null);
    const added = next.find((n) => !notes.includes(n));
    setNotes(added ? next.filter((n) => n === added || n.start !== added.start) : next);
  };

  const passed = result !== null && result.score >= level.threshold;
  const earned = result ? stars(result.score, level.threshold) : 0;
  const getPlayhead = useCallback(() => (playing ? engine.getPositionSteps() % BAR : null), [engine, playing]);
  const a = result?.analysis;
  const summary = a
    ? [
        `Acertaste ${a.hits} de ${call.length}`,
        a.wrongOctave ? `${a.wrongOctave} en la octava equivocada` : "",
        a.wrongNote ? `${a.wrongNote} en el paso justo pero con otra nota` : "",
        a.extra.length - a.wrongOctave - a.wrongNote > 0
          ? `${a.extra.length - a.wrongOctave - a.wrongNote} en un paso donde no va nada`
          : "",
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <main className="app">
      <header className="transport">
        <button type="button" className="ghost" onClick={onExit}>
          ← Mapa
        </button>
        <div>
          <span className="meta">
            {MODE_LABELS[level.mode]} · Capítulo {level.chapter} · {level.bpm} BPM · {level.key.tonic}{" "}
            {SCALE_NAMES[level.key.mode] ?? level.key.mode}
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
          <div className="segmented">
            <button
              type="button"
              aria-pressed={listen === "duel"}
              className={listen === "duel" ? "is-active" : ""}
              onClick={() => setListen("duel")}
              data-testid="listen-duel"
            >
              Duelo
            </button>
            <button
              type="button"
              aria-pressed={listen === "call"}
              className={listen === "call" ? "is-active" : ""}
              onClick={() => setListen("call")}
              data-testid="listen-call"
            >
              Solo la llamada
            </button>
          </div>
          <span className="meta">
            <kbd>R</kbd> alterna
          </span>
          <fieldset className="segmented" aria-label="Duración de las notas nuevas">
            {LENGTHS.map((l) => (
              <button
                key={l.key}
                type="button"
                aria-pressed={length === l.steps}
                className={length === l.steps ? "is-active" : ""}
                onClick={() => setLength(l.steps)}
              >
                {l.label} <kbd>{l.key}</kbd>
              </button>
            ))}
          </fieldset>
          <button type="button" className="ghost" onClick={reset} data-testid="reset">
            Borrar <kbd>Ctrl+⌫</kbd>
          </button>
        </div>

        <p className="hint" data-testid="duel-state">
          {listen === "call"
            ? "Suena solo la llamada, en loop."
            : playing && half === "response"
              ? "▶ Tu respuesta: lo que escribiste en el piano roll."
              : "▶ La llamada: escuchá y copiala abajo. Al compás siguiente suena tu respuesta."}
        </p>

        <PianoRoll
          notes={notes}
          ghostNotes={result ? call.filter((n) => result.analysis.missed.includes(n)) : undefined}
          steps={BAR}
          lowMidi={low}
          highMidi={high}
          scale={scalePitchClasses(level.key.tonic, level.key.mode)}
          getPlayhead={getPlayhead}
          onChange={edit}
          newNoteLength={length}
          height={420}
        />
        <p className="hint">
          Click en el piano roll para poner una nota; click sobre una nota para sacarla. La llamada no se muestra: sale
          de oído. Notas: {notes.length ? notes.map((n) => fromMidi(n.midi)).join(" ") : "ninguna todavía"}.
        </p>
      </section>

      <section className="result" aria-live="polite">
        <button type="button" className="primary" onClick={drop} data-testid="drop">
          Drop <kbd>Enter</kbd>
        </button>
        <ExportMidi
          name={level.id}
          isEmpty={notes.length === 0}
          song={() => ({ bpm: level.bpm, tracks: [{ name: "Bajo", channel: 2, notes }] })}
        />
        {result && (
          <div data-testid="result">
            <strong className={passed ? "ok" : "ko"}>{Math.round(result.score * 100)}%</strong>{" "}
            <span role="img" aria-label={`${earned} de 3 estrellas`}>
              {"★".repeat(earned) + "☆".repeat(3 - earned)}
            </span>{" "}
            <span className="meta" data-testid="summary">
              {summary}.{" "}
              {passed
                ? "¡Pasaste! El próximo nivel quedó desbloqueado."
                : "Los recuadros marcan dónde faltó una nota. Intento " + attempts + "."}
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
