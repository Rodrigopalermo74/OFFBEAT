import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { crc32, vlq, writeMidi, zipStore } from "./index.ts";

/** Lector mínimo de SMF para verificar lo que escribimos: devuelve las notas de cada pista. */
function readMidi(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (at: number) => String.fromCharCode(...bytes.slice(at, at + 4));
  expect(text(0)).toBe("MThd");
  const format = view.getUint16(8);
  const count = view.getUint16(10);
  const ppq = view.getUint16(12);
  let at = 14;
  const tracks: {
    name: string;
    tempo?: number;
    notes: { ch: number; midi: number; on: number; off: number; vel: number }[];
  }[] = [];
  for (let t = 0; t < count; t++) {
    expect(text(at)).toBe("MTrk");
    const end = at + 8 + view.getUint32(at + 4);
    at += 8;
    let tick = 0;
    const open = new Map<string, { on: number; vel: number }>();
    const track: (typeof tracks)[number] = { name: "", notes: [] };
    while (at < end) {
      let delta = 0;
      let b: number;
      do {
        b = bytes[at++] as number;
        delta = (delta << 7) | (b & 0x7f);
      } while (b & 0x80);
      tick += delta;
      const status = bytes[at++] as number;
      if (status === 0xff) {
        const type = bytes[at++] as number;
        const len = bytes[at++] as number;
        const data = bytes.slice(at, at + len);
        if (type === 0x03) track.name = String.fromCharCode(...data);
        if (type === 0x51) track.tempo = ((data[0] as number) << 16) | ((data[1] as number) << 8) | (data[2] as number);
        at += len;
      } else {
        const ch = (status & 0x0f) + 1;
        const midi = bytes[at++] as number;
        const vel = bytes[at++] as number;
        const key = `${ch}:${midi}`;
        if ((status & 0xf0) === 0x90) open.set(key, { on: tick, vel });
        else {
          const o = open.get(key);
          if (o) track.notes.push({ ch, midi, on: o.on, off: tick, vel: o.vel });
          open.delete(key);
        }
      }
    }
    tracks.push(track);
  }
  return { format, ppq, tracks };
}

describe("vlq", () => {
  it("codifica como dice el estándar", () => {
    expect(vlq(0)).toEqual([0x00]);
    expect(vlq(0x7f)).toEqual([0x7f]);
    expect(vlq(0x80)).toEqual([0x81, 0x00]);
    expect(vlq(0x3fff)).toEqual([0xff, 0x7f]);
  });
});

describe("writeMidi", () => {
  it("escribe tempo, nombre y notas en 1/16 exactos", () => {
    const bytes = writeMidi({
      bpm: 120,
      tracks: [{ name: "Bajo", channel: 2, notes: [{ midi: 33, start: 2, length: 2, velocity: 1 }] }],
    });
    const song = readMidi(bytes);
    expect(song.format).toBe(1);
    expect(song.ppq).toBe(96);
    expect(song.tracks[0]?.tempo).toBe(500_000);
    expect(song.tracks[1]?.name).toBe("Bajo");
    expect(song.tracks[1]?.notes).toEqual([{ ch: 2, midi: 33, on: 48, off: 96, vel: 127 }]);
  });
  it("ida y vuelta: cualquier clip se lee igual que se escribió", () => {
    const note = fc.record({
      midi: fc.integer({ min: 0, max: 127 }),
      start: fc.integer({ min: 0, max: 63 }),
      length: fc.integer({ min: 1, max: 16 }),
    });
    fc.assert(
      fc.property(fc.uniqueArray(note, { selector: (n) => `${n.midi}:${n.start}`, maxLength: 20 }), (notes) => {
        // Una sola nota por altura para que el lector no tenga que desambiguar solapamientos.
        const mono = notes.filter((n, i) => notes.findIndex((m) => m.midi === n.midi) === i);
        const song = readMidi(writeMidi({ bpm: 122, tracks: [{ name: "x", channel: 1, notes: mono }] }));
        const got = song.tracks[1]?.notes.map((n) => `${n.midi}:${n.on / 24}:${(n.off - n.on) / 24}`).sort();
        expect(got).toEqual(mono.map((n) => `${n.midi}:${n.start}:${n.length}`).sort());
      }),
    );
  });
});

describe("zipStore", () => {
  it("crc32 conocido", () => {
    expect(crc32(new TextEncoder().encode("hello"))).toBe(0x3610a686);
  });
  it("arma un zip con la firma, el archivo y el directorio central", () => {
    const data = new TextEncoder().encode("hola");
    const zip = zipStore([{ name: "a.mid", data }]);
    const view = new DataView(zip.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint32(14, true)).toBe(crc32(data));
    expect(String.fromCharCode(...zip.slice(30, 35))).toBe("a.mid");
    expect(String.fromCharCode(...zip.slice(35, 39))).toBe("hola");
    expect(view.getUint32(zip.length - 22, true)).toBe(0x06054b50);
  });
});
