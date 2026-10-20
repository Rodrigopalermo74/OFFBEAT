/**
 * Escritor de archivos MIDI estándar (SMF, formato 1). Sin dependencias:
 * lo que el jugador arma en el juego se lleva tal cual al DAW.
 */

export interface MidiNote {
  midi: number;
  /** Paso de inicio en 1/16. */
  start: number;
  /** Duración en pasos de 1/16. */
  length: number;
  /** 0–1; por defecto 0.8. */
  velocity?: number;
}

export interface MidiTrack {
  name: string;
  /** Canal 1–16 (el 10 es batería en General MIDI). */
  channel: number;
  notes: MidiNote[];
}

export interface MidiSong {
  bpm: number;
  tracks: MidiTrack[];
  /** Pulsos por negra; 96 alcanza para 1/16 exactos. */
  ppq?: number;
}

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0) & 0x7f);
const u32 = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
const u16 = (n: number) => [(n >>> 8) & 0xff, n & 0xff];

/** Cantidad de longitud variable (VLQ) de MIDI. */
export function vlq(value: number): number[] {
  if (value < 0 || !Number.isInteger(value)) throw new Error(`VLQ inválido: ${value}`);
  const bytes = [value & 0x7f];
  let rest = value >>> 7;
  while (rest > 0) {
    bytes.unshift((rest & 0x7f) | 0x80);
    rest >>>= 7;
  }
  return bytes;
}

function chunk(type: string, body: number[]): number[] {
  return [...ascii(type), ...u32(body.length), ...body];
}

function metaText(type: number, text: string): number[] {
  const bytes = ascii(text);
  return [0x00, 0xff, type, ...vlq(bytes.length), ...bytes];
}

function noteTrack(track: MidiTrack, ticksPerStep: number): number[] {
  if (track.channel < 1 || track.channel > 16) throw new Error(`Canal fuera de rango: ${track.channel}`);
  const ch = track.channel - 1;
  const events: { tick: number; order: number; bytes: number[] }[] = [];
  for (const n of track.notes) {
    const midi = Math.max(0, Math.min(127, Math.round(n.midi)));
    const velocity = Math.max(1, Math.min(127, Math.round((n.velocity ?? 0.8) * 127)));
    const on = Math.round(n.start * ticksPerStep);
    const off = Math.round((n.start + n.length) * ticksPerStep);
    events.push({ tick: on, order: 1, bytes: [0x90 | ch, midi, velocity] });
    events.push({ tick: Math.max(off, on + 1), order: 0, bytes: [0x80 | ch, midi, 0] });
  }
  // A igual tick, los note off van antes que los note on: una nota repetida no se corta sola.
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const body = metaText(0x03, track.name);
  let last = 0;
  for (const e of events) {
    body.push(...vlq(e.tick - last), ...e.bytes);
    last = e.tick;
  }
  body.push(0x00, 0xff, 0x2f, 0x00);
  return chunk("MTrk", body);
}

/** Arma el archivo .mid: una pista de tempo y compás 4/4, y una pista por cada `track`. */
export function writeMidi(song: MidiSong): Uint8Array {
  const ppq = song.ppq ?? 96;
  if (ppq % 4 !== 0) throw new Error("ppq tiene que ser múltiplo de 4 para tener 1/16 exactos");
  const tempo = Math.round(60_000_000 / song.bpm);
  const conductor = chunk("MTrk", [
    0x00,
    0xff,
    0x51,
    0x03,
    (tempo >>> 16) & 0xff,
    (tempo >>> 8) & 0xff,
    tempo & 0xff,
    0x00,
    0xff,
    0x58,
    0x04,
    0x04,
    0x02,
    0x18,
    0x08,
    0x00,
    0xff,
    0x2f,
    0x00,
  ]);
  const header = chunk("MThd", [...u16(1), ...u16(song.tracks.length + 1), ...u16(ppq)]);
  const tracks = song.tracks.flatMap((t) => noteTrack(t, ppq / 4));
  return new Uint8Array([...header, ...conductor, ...tracks]);
}
