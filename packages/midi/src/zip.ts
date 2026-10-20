/**
 * ZIP sin compresión (método "store"). Alcanza para empaquetar un .mid en
 * lugares donde solo se puede bajar un .zip.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = (CRC_TABLE[(crc ^ byte) & 0xff] as number) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

const le16 = (n: number) => [n & 0xff, (n >>> 8) & 0xff];
const le32 = (n: number) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];

export function zipStore(entries: ZipEntry[]): Uint8Array {
  const out: number[] = [];
  const central: number[] = [];
  for (const entry of entries) {
    const name = [...new TextEncoder().encode(entry.name)];
    const crc = crc32(entry.data);
    const size = entry.data.length;
    const offset = out.length;
    // version 20, flag bit 11 (nombre en UTF-8), método 0, fecha y hora en cero.
    const common = [...le16(20), ...le16(0x0800), ...le16(0), ...le16(0), ...le16(0x21), ...le32(crc)];
    out.push(...le32(0x04034b50), ...common, ...le32(size), ...le32(size), ...le16(name.length), ...le16(0), ...name);
    out.push(...entry.data);
    central.push(
      ...le32(0x02014b50),
      ...le16(20),
      ...common,
      ...le32(size),
      ...le32(size),
      ...le16(name.length),
      ...le16(0),
      ...le16(0),
      ...le16(0),
      ...le16(0),
      ...le32(0),
      ...le32(offset),
      ...name,
    );
  }
  const centralOffset = out.length;
  out.push(...central);
  out.push(
    ...le32(0x06054b50),
    ...le16(0),
    ...le16(0),
    ...le16(entries.length),
    ...le16(entries.length),
    ...le32(central.length),
    ...le32(centralOffset),
    ...le16(0),
  );
  return new Uint8Array(out);
}
