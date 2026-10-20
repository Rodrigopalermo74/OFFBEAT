import * as Tone from "tone";
import { type AudioEngine, DRUM_VOICES, type DrumPattern, type DrumVoice, type NoteClip } from "./types.ts";

const STEPS_PER_BAR = 16;

/**
 * Implementación Web Audio con Tone.js. Toda la temporización se hace con el Transport de Tone
 * (lookahead scheduling sobre AudioContext.currentTime); los callbacks reciben `time` y lo usan siempre.
 */
export class ToneEngine implements AudioEngine {
  private drums: DrumPattern = emptyPattern(STEPS_PER_BAR);
  private pad: NoteClip[] = [];
  private padLoopSteps = STEPS_PER_BAR * 4;
  private bass: NoteClip[] = [];
  private bassLoopSteps = STEPS_PER_BAR;
  private swing = 0.5;
  private instruments: ReturnType<typeof createInstruments> | null = null;
  private repeatId: number | null = null;

  get isPlaying(): boolean {
    return Tone.getTransport().state === "started";
  }

  async start(): Promise<void> {
    await Tone.start();
    if (this.instruments) return;
    this.instruments = createInstruments();
    const transport = Tone.getTransport();
    // Un callback por corchea que programa los dos 1/16 que contiene: así el swing es exacto.
    this.repeatId = transport.scheduleRepeat((time) => this.tick(time), "8n");
  }

  play(): void {
    Tone.getTransport().start("+0.05");
  }

  stop(): void {
    const transport = Tone.getTransport();
    transport.stop();
    transport.position = 0;
    this.instruments?.pad.releaseAll();
    this.instruments?.bass.triggerRelease();
  }

  setBpm(bpm: number): void {
    Tone.getTransport().bpm.value = bpm;
  }

  setSwing(swing: number): void {
    this.swing = Math.min(0.75, Math.max(0.5, swing));
  }

  setDrumPattern(pattern: DrumPattern): void {
    this.drums = pattern;
  }

  setPadClip(notes: NoteClip[], loopSteps: number): void {
    this.pad = notes;
    this.padLoopSteps = loopSteps;
  }

  setBassClip(notes: NoteClip[], loopSteps: number): void {
    this.bass = notes;
    this.bassLoopSteps = loopSteps;
  }

  getPositionSteps(): number {
    const transport = Tone.getTransport();
    return transport.ticks / (transport.PPQ / 4);
  }

  getLatency() {
    const ctx = Tone.getContext().rawContext as AudioContext;
    return {
      baseLatency: ctx.baseLatency ?? 0,
      outputLatency: ctx.outputLatency ?? 0,
      lookAhead: Tone.getContext().lookAhead,
    };
  }

  dispose(): void {
    if (this.repeatId !== null) Tone.getTransport().clear(this.repeatId);
    this.instruments?.dispose();
    this.instruments = null;
  }

  private tick(time: number): void {
    const transport = Tone.getTransport();
    const sixteenth = Tone.Time("16n").toSeconds();
    const firstStep = Math.round(transport.getTicksAtTime(time) / (transport.PPQ / 4));
    for (const offset of [0, 1]) {
      const step = firstStep + offset;
      const at = time + (offset === 1 ? 2 * sixteenth * this.swing : 0);
      this.triggerDrums(step, at);
      this.triggerPad(step, at, sixteenth);
      this.triggerBass(step, at, sixteenth);
    }
  }

  private triggerDrums(step: number, time: number): void {
    const inst = this.instruments;
    if (!inst) return;
    for (const voice of DRUM_VOICES) {
      const steps = this.drums[voice];
      const velocity = steps[step % steps.length] ?? 0;
      if (velocity > 0) inst.drums[voice](time, velocity);
    }
  }

  private triggerPad(step: number, time: number, sixteenth: number): void {
    const inst = this.instruments;
    if (!inst) return;
    const local = step % this.padLoopSteps;
    for (const note of this.pad) {
      if (note.start === local) {
        inst.pad.triggerAttackRelease(
          Tone.Frequency(note.midi, "midi").toFrequency(),
          note.length * sixteenth * 0.95,
          time,
          0.5,
        );
      }
    }
  }

  private triggerBass(step: number, time: number, sixteenth: number): void {
    const inst = this.instruments;
    if (!inst) return;
    const local = step % this.bassLoopSteps;
    for (const note of this.bass) {
      if (note.start === local) {
        inst.bass.triggerAttackRelease(
          Tone.Frequency(note.midi, "midi").toFrequency(),
          note.length * sixteenth * 0.9,
          time,
          0.8,
        );
      }
    }
  }
}

function emptyPattern(steps: number): DrumPattern {
  return Object.fromEntries(DRUM_VOICES.map((v) => [v, new Array<number>(steps).fill(0)])) as DrumPattern;
}

/** Batería sintetizada (sin samples: cero problemas de licencia), un pad tipo Juno y un bajo mono. */
function createInstruments() {
  const master = new Tone.Compressor({ threshold: -12, ratio: 3 }).toDestination();

  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.03,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.05 },
  }).connect(master);

  const clapFilter = new Tone.Filter(1500, "bandpass").connect(master);
  const clap = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
  }).connect(clapFilter);

  const hatFilter = new Tone.Filter(8000, "highpass").connect(master);
  const closedHat = new Tone.NoiseSynth({ envelope: { attack: 0.001, decay: 0.04, sustain: 0 } }).connect(hatFilter);
  const openHat = new Tone.NoiseSynth({ envelope: { attack: 0.001, decay: 0.25, sustain: 0 } }).connect(hatFilter);

  const rim = new Tone.MembraneSynth({
    pitchDecay: 0.005,
    octaves: 2,
    envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
  }).connect(master);

  const reverb = new Tone.Reverb({ decay: 3, wet: 0.3 }).connect(master);
  const padFilter = new Tone.Filter(1800, "lowpass").connect(reverb);
  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fatsawtooth", count: 3, spread: 20 },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.6, release: 0.4 },
    volume: -14,
  }).connect(padFilter);

  // Bajo seco (sin reverb) con envolvente de filtro corta: se lee bien la altura de cada nota.
  const bass = new Tone.MonoSynth({
    oscillator: { type: "sawtooth" },
    filter: { Q: 2, type: "lowpass", rolloff: -24 },
    envelope: { attack: 0.005, decay: 0.2, sustain: 0.5, release: 0.08 },
    filterEnvelope: { attack: 0.005, decay: 0.15, sustain: 0.3, release: 0.1, baseFrequency: 180, octaves: 2.5 },
    volume: -8,
  }).connect(master);

  const drums: Record<DrumVoice, (time: number, velocity: number) => void> = {
    kick: (t, v) => kick.triggerAttackRelease("C1", "8n", t, v),
    clap: (t, v) => clap.triggerAttackRelease("16n", t, v * 0.6),
    closedHat: (t, v) => closedHat.triggerAttackRelease("32n", t, v * 0.3),
    openHat: (t, v) => openHat.triggerAttackRelease("8n", t, v * 0.25),
    rim: (t, v) => rim.triggerAttackRelease("A4", "32n", t, v * 0.5),
  };

  return {
    drums,
    pad,
    bass,
    dispose() {
      for (const node of [
        kick,
        clap,
        clapFilter,
        closedHat,
        openHat,
        hatFilter,
        rim,
        pad,
        padFilter,
        reverb,
        bass,
        master,
      ])
        node.dispose();
    },
  };
}
