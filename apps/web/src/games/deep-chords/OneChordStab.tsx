import type { AudioEngine, NoteClip } from "@offbeat/audio-engine";
import { analyzeStab, type StabAnalysis, type StabTake, stabBars, stars } from "@offbeat/game-core";
import {
  fromMidi,
  type StabMotion,
  type StabShape,
  scalePitchClasses,
  stabName,
  stabNotes,
  stabRootMidi,
} from "@offbeat/theory";
import { PianoRoll } from "@offbeat/ui-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DawCard } from "../../components/DawCard.tsx";
import { ExportMidi } from "../../components/ExportMidi.tsx";
import { MODE_LABELS, SCALE_NAMES, type StabLevel } from "../../levels.ts";
import { STARTER_GROOVE } from "../../patterns.ts";

interface OneChordStabProps {
  level: StabLevel;
  engine: AudioEngine;
  best: number;
  onFinish(score: number): void;
  onExit(): void;
  onNext?: () => void;
}

type Listen = "target" | "mine";

const BAR = 16;
const STAB_LENGTH = 2;
const PC_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const MOTION_NAMES: Record<StabMotion, string> = { parallel: "Paralelo", diatonic: "Diatónico" };
const LOW = 48;
const HIGH = 77;

const noteName = (midi: number) => fromMidi(midi, true).replace(/-?\d+$/, "");

export function OneChordStab({ level, engine, best, onFinish, onExit, onNext }: OneChordStabProps) {
  const { target, key } = level;
  const bars = target.roots.length;
  const scale = useMemo(() => scalePitchClasses(key.tonic, key.mode), [key]);

  const [shape, setShape] = useState<StabShape>(target.shapes[0] as StabShape);
  const [motion, setMotion] = useState<StabMotion>(target.motions[0] as StabMotion);
  const [roots, setRoots] = useState<(number | null)[]>(() => new Array(bars).fill(null));
  const [selected, setSelected] = useState(0);
  const [listen, setListen] = useState<Listen>("target");
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<StabAnalysis | null>(null);
  const [attempts, setAttempts] = useState(0);

  const mine: StabTake = useMemo(
    () => ({ shape, motion, roots: roots.map((pc) => (pc === null ? null : (PC_NAMES[pc] as string))) }),
    [shape, motion, roots],
  );
  const goal: StabTake = useMemo(() => ({ shape: target.shape, motion: target.motion, roots: target.roots }), [target]);

  const clipOf = useCallback(
    (take: StabTake): NoteClip[] =>
      stabBars(take, key).flatMap((notes, bar) =>
        target.rhythm.flatMap((step) => notes.map((midi) => ({ midi, start: bar * BAR + step, length: STAB_LENGTH }))),
      ),
    [key, target.rhythm],
  );
  const myBars = useMemo(() => stabBars(mine, key), [mine, key]);
  const myRoll = useMemo(
    () => myBars.flatMap((notes, bar) => notes.map((midi) => ({ midi, start: bar * BAR, length: BAR }))),
    [myBars],
  );

  useEffect(() => {
    engine.setBpm(level.bpm);
    engine.setSwing(0.54);
    engine.setDrumPattern(STARTER_GROOVE);
    engine.setBassClip([], BAR);
  }, [engine, level.bpm]);
  useEffect(() => {
    engine.setPadClip(clipOf(listen === "target" ? goal : mine), bars * BAR);
  }, [engine, clipOf, listen, goal, mine, bars]);
  useEffect(() => () => engine.stop(), [engine]);

  const togglePlay = useCallback(() => {
    if (playing) engine.stop();
    else engine.play();
    setPlaying(!playing);
  }, [engine, playing]);

  const edit = useCallback((fn: (prev: (number | null)[]) => (number | null)[]) => {
    setResult(null);
    setRoots(fn);
  }, []);

  /** Pone una fundamental en el compás elegido y pasa al siguiente. */
  const place = useCallback(
    (pc: number) => {
      edit((prev) => prev.map((r, i) => (i === selected ? pc : r)));
      setSelected((s) => (s + 1) % bars);
      setListen("mine");
    },
    [edit, selected, bars],
  );

  /** ↑/↓: en paralelo sube o baja un semitono; en diatónico, al grado vecino de la escala. */
  const nudge = useCallback(
    (dir: 1 | -1) => {
      edit((prev) =>
        prev.map((r, i) => {
          if (i !== selected) return r;
          if (r === null) return scale[0] as number;
          let next = (r + dir + 12) % 12;
          while (motion === "diatonic" && !scale.includes(next)) next = (next + dir + 12) % 12;
          return next;
        }),
      );
      setListen("mine");
    },
    [edit, selected, scale, motion],
  );

  const chooseShape = useCallback((s: StabShape) => {
    setResult(null);
    setShape(s);
    setListen("mine");
  }, []);

  const chooseMotion = useCallback(
    (m: StabMotion) => {
      setResult(null);
      setMotion(m);
      setListen("mine");
      // En diatónico la fundamental tiene que estar en la escala: las cromáticas bajan al grado de abajo.
      if (m === "diatonic") setRoots((prev) => prev.map((r) => (r === null || scale.includes(r) ? r : (r + 11) % 12)));
    },
    [scale],
  );

  const clear = useCallback(() => edit((prev) => prev.map((r, i) => (i === selected ? null : r))), [edit, selected]);

  const drop = useCallback(() => {
    const analysis = analyzeStab(goal, mine, key);
    setResult(analysis);
    setAttempts((a) => a + 1);
    onFinish(analysis.score);
  }, [goal, mine, key, onFinish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const s = target.shapes[Number(e.key) - 1];
      if (s && /^[1-4]$/.test(e.key)) {
        chooseShape(s);
      } else if ((e.key === "p" || e.key === "P") && target.motions.length > 1) {
        chooseMotion(motion === "parallel" ? "diatonic" : "parallel");
      } else if (e.key === "r" || e.key === "R") {
        setListen((l) => (l === "target" ? "mine" : "target"));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelected((i) => (i - 1 + bars) % bars);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelected((i) => (i + 1) % bars);
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        nudge(e.key === "ArrowUp" ? 1 : -1);
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
  }, [target, motion, bars, chooseShape, chooseMotion, nudge, clear, togglePlay, drop, onExit]);

  // Comparación para el compás elegido: la misma fundamental en paralelo y en diatónico.
  const selectedRoot = roots[selected];
  const compare = useMemo(() => {
    if (selectedRoot == null || !scale.includes(selectedRoot)) return null;
    const midi = stabRootMidi(PC_NAMES[selectedRoot] as string);
    return (["parallel", "diatonic"] as const).map((m) => {
      const notes = stabNotes(midi, shape, m, key.tonic, key.mode);
      return {
        motion: m,
        name: stabName(midi, shape, m, key.tonic, key.mode),
        notes: notes.map(noteName),
        outside: notes.filter((n) => !scale.includes(n % 12)).map(noteName),
      };
    });
  }, [selectedRoot, shape, key, scale]);

  const passed = result !== null && result.score >= level.threshold;
  const earned = result ? stars(result.score, level.threshold) : 0;
  const getPlayhead = useCallback(() => (playing ? engine.getPositionSteps() : null), [engine, playing]);
  const keyName = `${key.tonic} ${SCALE_NAMES[key.mode] ?? key.mode}`;

  return (
    <main className="app">
      <header className="transport">
        <button type="button" className="ghost" onClick={onExit}>
          ← Mapa
        </button>
        <div>
          <span className="meta">
            {MODE_LABELS[level.mode]} · Capítulo {level.chapter} · {level.bpm} BPM · {keyName}
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
          <fieldset className="segmented" aria-label="Qué suena">
            {(["target", "mine"] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={listen === l}
                className={listen === l ? "is-active" : ""}
                onClick={() => setListen(l)}
                data-testid={`listen-${l}`}
              >
                {l === "target" ? "Objetivo" : "Tu versión"}
              </button>
            ))}
          </fieldset>
          <span className="meta">
            <kbd>R</kbd> alterna
          </span>
        </div>

        <p className="hint" data-testid="target-roots">
          {target.showRoots
            ? `Fundamentales del objetivo: ${target.roots.join(" · ")}`
            : "Las fundamentales del objetivo salen de oído."}
        </p>

        <div className="section-head">
          <fieldset className="segmented" aria-label="Forma del stab">
            {target.shapes.map((s, i) => (
              <button
                key={s}
                type="button"
                aria-pressed={shape === s}
                className={shape === s ? "is-active" : ""}
                onClick={() => chooseShape(s)}
                data-testid={`shape-${s}`}
              >
                {s} <kbd>{i + 1}</kbd>
              </button>
            ))}
          </fieldset>
          {target.motions.length > 1 && (
            <>
              <fieldset className="segmented" aria-label="Movimiento">
                {target.motions.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={motion === m}
                    className={motion === m ? "is-active" : ""}
                    onClick={() => chooseMotion(m)}
                    data-testid={`motion-${m}`}
                  >
                    {MOTION_NAMES[m]}
                  </button>
                ))}
              </fieldset>
              <span className="meta">
                <kbd>P</kbd> alterna
              </span>
            </>
          )}
        </div>

        <ol className="slots" style={{ gridTemplateColumns: `repeat(${bars}, 1fr)` }}>
          {roots.map((pc, i) => {
            const notes = myBars[i] ?? [];
            const outside = notes.filter((n) => !scale.includes(n % 12)).map(noteName);
            const ok = result?.rootsOk[i];
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: un casillero por compás
              <li key={i}>
                <button
                  type="button"
                  className={`slot ${i === selected ? "is-selected" : ""} ${ok === undefined ? "" : ok ? "is-ok" : "is-ko"}`}
                  onClick={() => setSelected(i)}
                  aria-pressed={i === selected}
                  data-testid={`slot-${i}`}
                >
                  <span className="meta">
                    Compás {i + 1}
                    {ok === undefined ? "" : ok ? " ✓" : " ✗"}
                  </span>
                  <strong>
                    {pc === null || notes.length === 0
                      ? "—"
                      : stabName(stabRootMidi(PC_NAMES[pc] as string), shape, motion, key.tonic, key.mode)}
                  </strong>
                  <span>
                    {pc === null
                      ? "Elegí la fundamental"
                      : outside.length
                        ? `Fuera de la escala: ${outside.join(" ")}`
                        : "Todo dentro de la escala"}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <fieldset className="keys" aria-label="Fundamental del compás elegido">
          {PC_NAMES.map((name, pc) => {
            const black = name.length > 1;
            return (
              <button
                key={name}
                type="button"
                className={`key ${black ? "is-black" : ""} ${roots[selected] === pc ? "is-active" : ""}`}
                disabled={motion === "diatonic" && !scale.includes(pc)}
                onClick={() => place(pc)}
                data-testid={`root-${name}`}
              >
                {name}
              </button>
            );
          })}
        </fieldset>
        <p className="hint">
          Click en una tecla para poner la fundamental del compás elegido. <kbd>↑</kbd> <kbd>↓</kbd> la mueven (un
          semitono en paralelo, un grado de la escala en diatónico), <kbd>←</kbd> <kbd>→</kbd> cambian de compás y{" "}
          <kbd>⌫</kbd> lo vacía.
        </p>

        <PianoRoll
          notes={myRoll}
          steps={bars * BAR}
          lowMidi={LOW}
          highMidi={HIGH}
          scale={scale}
          getPlayhead={getPlayhead}
          height={240}
        />
      </section>

      <section>
        <h2>Paralelo o diatónico</h2>
        {compare ? (
          <ul className="checks" data-testid="compare">
            {compare.map((c) => (
              <li key={c.motion} className={c.motion === motion ? "ok" : ""}>
                <strong>{MOTION_NAMES[c.motion]}:</strong> {c.name} ({c.notes.join(" ")}).{" "}
                {c.outside.length
                  ? `${c.outside.join(" y ")} no están en ${keyName}: ese cromatismo es el color de un stab.`
                  : `Todo queda en ${keyName}.`}
              </li>
            ))}
          </ul>
        ) : (
          <p className="hint">
            Elegí una fundamental de la escala en el compás marcado para comparar cómo suena la misma forma movida en
            paralelo y en diatónico.
          </p>
        )}
      </section>

      <section className="result" aria-live="polite">
        <button type="button" className="primary" onClick={drop} data-testid="drop">
          Drop <kbd>Enter</kbd>
        </button>
        <ExportMidi
          name={level.id}
          isEmpty={roots.every((r) => r === null)}
          song={() => ({ bpm: level.bpm, tracks: [{ name: "Stab", channel: 1, notes: clipOf(mine) }] })}
        />
        {result && (
          <div data-testid="result">
            <strong className={passed ? "ok" : "ko"}>{Math.round(result.score * 100)}%</strong>{" "}
            <span role="img" aria-label={`${earned} de 3 estrellas`}>
              {"★".repeat(earned) + "☆".repeat(3 - earned)}
            </span>{" "}
            <span className="meta" data-testid="summary">
              {[
                result.shapeOk ? "La forma está bien" : "La forma no es esa",
                target.motions.length > 1
                  ? result.motionOk
                    ? "el movimiento también"
                    : "el movimiento no es ese"
                  : "",
                `fundamentales: ${result.rootsOk.filter(Boolean).length} de ${bars}`,
              ]
                .filter(Boolean)
                .join(", ")}
              .{" "}
              {passed
                ? "¡Pasaste! El próximo nivel quedó desbloqueado."
                : `Volvé a escuchar el objetivo. Intento ${attempts}.`}
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
