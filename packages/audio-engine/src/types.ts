export const DRUM_VOICES = ["kick", "clap", "closedHat", "openHat", "rim"] as const;
export type DrumVoice = (typeof DRUM_VOICES)[number];

/** Velocity 0–1 por paso de 1/16 (0 = silencio). */
export type DrumPattern = Record<DrumVoice, number[]>;

export interface NoteClip {
  midi: number;
  /** Paso de inicio en 1/16. */
  start: number;
  /** Duración en pasos de 1/16. */
  length: number;
}

export interface LatencyInfo {
  baseLatency: number;
  outputLatency: number;
  lookAhead: number;
}

/**
 * Contrato del motor de audio. La UI solo habla con esta interfaz, nunca con Tone.js,
 * para poder cambiar la implementación (Web Audio, react-native-audio-api) sin tocar el juego.
 */
export interface AudioEngine {
  /** Debe llamarse desde un gesto del usuario (requisito de iOS/Chrome para habilitar audio). */
  start(): Promise<void>;
  play(): void;
  stop(): void;
  readonly isPlaying: boolean;
  setBpm(bpm: number): void;
  /** 0.5 = recto, 0.75 = swing máximo (estilo MPC), aplicado a los 1/16 impares. */
  setSwing(swing: number): void;
  setDrumPattern(pattern: DrumPattern): void;
  /** Notas del pad en un loop de `loopSteps` pasos. */
  setPadClip(notes: NoteClip[], loopSteps: number): void;
  /** Notas del bajo (monofónico) en un loop de `loopSteps` pasos. */
  setBassClip(notes: NoteClip[], loopSteps: number): void;
  /** Posición actual en pasos de 1/16 (con fracción) para dibujar el playhead. */
  getPositionSteps(): number;
  getLatency(): LatencyInfo;
}
