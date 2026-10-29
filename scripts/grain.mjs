// Ziarno papieru (v7.1): public/grain.png, 256×256, szarość 8-bit, komórki 2×2 (widoczne na retinie), bez
// zależności (własny koder PNG: zlib + CRC32). Deterministyczne ziarno (LCG), więc plik nie zmienia się między buildami.
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const SIZE = 256;
const CELL = 2;
let seed = 20261029;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

const rows = [];
const cells = SIZE / CELL;
const values = Array.from({ length: cells * cells }, () => Math.round(96 + rand() * 128));
for (let y = 0; y < SIZE; y++) {
  const row = Buffer.alloc(1 + SIZE);
  row[0] = 0;
  for (let x = 0; x < SIZE; x++) row[1 + x] = values[Math.floor(y / CELL) * cells + Math.floor(x / CELL)];
  rows.push(row);
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 0; // grayscale
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(Buffer.concat(rows), { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);
writeFileSync(new URL("../public/grain.png", import.meta.url), png);
console.log(`public/grain.png ${png.length} B`);
