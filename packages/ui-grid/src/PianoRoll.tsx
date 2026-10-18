import { type MouseEvent, useEffect, useRef } from "react";

export interface RollNote {
  midi: number;
  start: number;
  length: number;
}

export interface PianoRollProps {
  notes: RollNote[];
  steps: number;
  lowMidi: number;
  highMidi: number;
  /** Clases de altura (0–11) resaltadas como "dentro de la escala". */
  scale?: number[];
  /** Devuelve la posición actual en pasos; se lee en cada frame para el playhead. */
  getPlayhead?: () => number | null;
  onChange?(notes: RollNote[]): void;
  newNoteLength?: number;
  /** Si se define, las notas nuevas ocupan el bloque entero de `snapSteps` pasos donde se hizo click (por ejemplo, un compás por acorde). */
  snapSteps?: number;
  height?: number;
  /** Se llama con los FPS medidos cada segundo (para el modo de estrés). */
  onFps?(fps: number): void;
}

const KEY_WIDTH = 36;
const BLACK = new Set([1, 3, 6, 8, 10]);
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Piano roll en Canvas 2D: dibuja a 60 fps sin tocar el DOM por nota. */
export function PianoRoll({
  notes,
  steps,
  lowMidi,
  highMidi,
  scale,
  getPlayhead,
  onChange,
  newNoteLength = 4,
  snapSteps,
  height = 360,
  onFps,
}: PianoRollProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const props = useRef({ notes, steps, lowMidi, highMidi, scale, getPlayhead, onFps });
  props.current = { notes, steps, lowMidi, highMidi, scale, getPlayhead, onFps };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let frame = 0;
    let frames = 0;
    let lastFpsAt = performance.now();
    // Los colores salen de variables CSS; se leen una vez para no recalcular estilos en cada frame.
    const css = getComputedStyle(canvas);
    const palette = new Map<string, string>();
    const color = (name: string, fallback: string) => {
      let value = palette.get(name);
      if (value === undefined) {
        value = css.getPropertyValue(name).trim() || fallback;
        palette.set(name, value);
      }
      return value;
    };

    const draw = (now: number) => {
      const p = props.current;
      const dpr = window.devicePixelRatio || 1;
      const { clientWidth: w, clientHeight: h } = canvas;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const rows = p.highMidi - p.lowMidi + 1;
      const rowH = h / rows;
      const stepW = (w - KEY_WIDTH) / p.steps;

      ctx.fillStyle = color("--roll-bg", "#111");
      ctx.fillRect(0, 0, w, h);

      for (let midi = p.lowMidi; midi <= p.highMidi; midi++) {
        const y = (p.highMidi - midi) * rowH;
        const pc = midi % 12;
        const inScale = p.scale?.includes(pc);
        if (inScale) {
          ctx.fillStyle = color("--roll-scale", "#1d2a2f");
          ctx.fillRect(KEY_WIDTH, y, w - KEY_WIDTH, rowH);
        }
        ctx.fillStyle = BLACK.has(pc) ? color("--key-black", "#222") : color("--key-white", "#ddd");
        ctx.fillRect(0, y, KEY_WIDTH - 2, rowH - 1);
        if (pc === 0 && rowH >= 8) {
          ctx.fillStyle = color("--key-label", "#333");
          ctx.font = `${Math.min(10, rowH - 1)}px ui-monospace, monospace`;
          ctx.fillText(`${NAMES[pc]}${Math.floor(midi / 12) - 1}`, 2, y + rowH - 2);
        }
      }

      for (let s = 0; s <= p.steps; s++) {
        ctx.fillStyle =
          s % 16 === 0
            ? color("--grid-bar", "#555")
            : s % 4 === 0
              ? color("--grid-beat", "#333")
              : color("--grid-step", "#1b1b1b");
        ctx.fillRect(KEY_WIDTH + s * stepW, 0, 1, h);
      }

      ctx.fillStyle = color("--note", "#4fd1c5");
      for (const n of p.notes) {
        if (n.midi < p.lowMidi || n.midi > p.highMidi) continue;
        const y = (p.highMidi - n.midi) * rowH;
        ctx.fillRect(KEY_WIDTH + n.start * stepW + 1, y + 1, n.length * stepW - 2, rowH - 2);
      }

      const head = p.getPlayhead?.();
      if (head !== null && head !== undefined) {
        ctx.fillStyle = color("--playhead", "#ff5c8a");
        ctx.fillRect(KEY_WIDTH + (head % p.steps) * stepW, 0, 2, h);
      }

      frames++;
      if (now - lastFpsAt >= 1000) {
        p.onFps?.(Math.round((frames * 1000) / (now - lastFpsAt)));
        frames = 0;
        lastFpsAt = now;
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - KEY_WIDTH;
    if (x < 0) return;
    const rows = highMidi - lowMidi + 1;
    const midi = highMidi - Math.floor(((e.clientY - rect.top) / rect.height) * rows);
    const step = Math.floor((x / (rect.width - KEY_WIDTH)) * steps);
    const hit = notes.find((n) => n.midi === midi && step >= n.start && step < n.start + n.length);
    if (hit) {
      onChange(notes.filter((n) => n !== hit));
      return;
    }
    const start = snapSteps ? Math.floor(step / snapSteps) * snapSteps : step;
    const length = snapSteps ?? Math.min(newNoteLength, steps - step);
    onChange([...notes, { midi, start, length }]);
  };

  return (
    <canvas
      ref={canvasRef}
      className="piano-roll"
      data-testid="piano-roll"
      style={{ width: "100%", height }}
      onClick={handleClick}
      aria-label="Piano roll: click para agregar o quitar notas"
    />
  );
}
