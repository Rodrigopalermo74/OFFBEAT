import { type AudioEngine, DRUM_VOICES, type DrumPattern, type NoteClip } from "@offbeat/audio-engine";
import { detectChord, scalePitchClasses } from "@offbeat/theory";
import { PianoRoll, StepSequencer } from "@offbeat/ui-grid";
import { useEffect, useRef, useState } from "react";
import { progressionClip, STARTER_GROOVE, STARTER_PROGRESSION, stressClip, VOICE_LABELS } from "../patterns.ts";

const LOOP_STEPS = 64;
const MODES = { minor: "La menor (eólico)", dorian: "La dórico" } as const;

/** Sandbox del spike de F0: groove libre + piano roll con modo de estrés. */
export function Studio({ engine, onExit }: { engine: AudioEngine; onExit(): void }) {
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(122);
  const [swing, setSwing] = useState(0.54);
  const [groove, setGroove] = useState<DrumPattern>(STARTER_GROOVE);
  const [notes, setNotes] = useState<NoteClip[]>(() => progressionClip(STARTER_PROGRESSION));
  const [mode, setMode] = useState<keyof typeof MODES>("minor");
  const [stress, setStress] = useState(false);
  const [fps, setFps] = useState(0);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const lastStep = useRef<number | null>(null);

  useEffect(() => engine.setBpm(bpm), [engine, bpm]);
  useEffect(() => engine.setSwing(swing), [engine, swing]);
  useEffect(() => engine.setDrumPattern(groove), [engine, groove]);
  useEffect(() => engine.setPadClip(stress ? [] : notes, LOOP_STEPS), [engine, notes, stress]);
  useEffect(() => () => engine.stop(), [engine]);

  const getPlayhead = () => {
    if (!engine.isPlaying) {
      if (lastStep.current !== null) {
        lastStep.current = null;
        setCurrentStep(null);
      }
      return null;
    }
    const pos = engine.getPositionSteps();
    const step = Math.floor(pos) % 16;
    if (step !== lastStep.current) {
      lastStep.current = step;
      setCurrentStep(step);
    }
    return pos;
  };

  const togglePlay = () => {
    if (engine.isPlaying) engine.stop();
    else engine.play();
    setPlaying(!playing);
  };

  const toggleStep = (voice: string, step: number) => {
    setGroove((g) => {
      const v = voice as keyof DrumPattern;
      const next = [...g[v]];
      next[step] = next[step] ? 0 : 1;
      return { ...g, [v]: next };
    });
  };

  const bars = [0, 1, 2, 3].map((bar) => {
    const inBar = notes.filter((n) => n.start <= bar * 16 && n.start + n.length > bar * 16).map((n) => n.midi);
    return detectChord(inBar)[0] ?? "—";
  });

  const latency = engine.getLatency();
  return (
    <main className="app">
      <header className="transport">
        <button type="button" className="ghost" onClick={onExit}>
          ← Mapa
        </button>
        <h1>Studio</h1>
        <button type="button" className="primary" onClick={togglePlay} data-testid="play">
          {playing ? "Stop" : "Play"}
        </button>
        <label>
          BPM <input type="number" min={110} max={130} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} />
        </label>
        <label>
          Swing {Math.round(swing * 100)}%
          <input
            type="range"
            min={0.5}
            max={0.75}
            step={0.01}
            value={swing}
            onChange={(e) => setSwing(Number(e.target.value))}
          />
        </label>
        <span className="meta" title="baseLatency + outputLatency + lookAhead del AudioContext">
          Latencia {Math.round((latency.baseLatency + latency.outputLatency) * 1000)} ms · lookahead{" "}
          {Math.round(latency.lookAhead * 1000)} ms
        </span>
      </header>

      <section>
        <h2>Groove Lab</h2>
        <StepSequencer
          voices={DRUM_VOICES}
          labels={VOICE_LABELS}
          pattern={groove}
          currentStep={currentStep}
          onToggle={toggleStep}
        />
      </section>

      <section>
        <div className="section-head">
          <h2>Deep Chords</h2>
          <div className="chips" data-testid="chords">
            {bars.map((c, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: un chip por compás
              <span key={i} className="chip">
                {c}
              </span>
            ))}
          </div>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as keyof typeof MODES)}
            aria-label="Escala resaltada"
          >
            {Object.entries(MODES).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <label className="stress">
            <input
              type="checkbox"
              checked={stress}
              onChange={(e) => setStress(e.target.checked)}
              data-testid="stress"
            />{" "}
            Estrés: 512 notas
          </label>
          <span className="meta" data-testid="fps">
            {fps} fps
          </span>
        </div>
        <PianoRoll
          notes={stress ? stressClip() : notes}
          steps={LOOP_STEPS}
          lowMidi={48}
          highMidi={84}
          scale={scalePitchClasses("A", mode)}
          getPlayhead={getPlayhead}
          onChange={stress ? undefined : setNotes}
          onFps={setFps}
        />
        <p className="hint">Click en el grid para agregar o quitar notas. Las filas resaltadas están en la escala.</p>
      </section>
    </main>
  );
}
