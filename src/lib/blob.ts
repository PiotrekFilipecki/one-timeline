// Blob-bohater (v7.1): jeden kształt wędruje przez rozdziały i przybiera formę pojęcia. Ścieżki w boxie 200×200,
// SSR renderuje kształt spoczynku rozdziału (bez JS i przy reduced motion stoi); JS zaczyna od `base` i morfuje
// (MorphSVG). Pattern (rastr w farbie typografii) animuje się w trakcie morfu: dwie farby zostają.
import type { ChapterId } from "./palette";
import { ease, type EaseName } from "./eases";

export const BLOB_SHAPES = {
  /** Spoczynek bohatera: organiczna kropla. */
  base: "M104,18 C150,10 186,52 178,98 C172,132 190,166 150,182 C112,196 70,176 44,150 C12,118 20,70 52,42 C68,28 84,22 104,18 Z",
  /** POSITION: bilet z nacięciami (ktoś wchodzi bez kolejki). */
  ticket: "M34,58 H166 C174,58 180,64 180,72 V90 C170,90 164,96 164,100 C164,104 170,110 180,110 V128 C180,136 174,142 166,142 H34 C26,142 20,136 20,128 V110 C30,110 36,104 36,100 C36,96 30,90 20,90 V72 C20,64 26,58 34,58 Z",
  /** EASE: kulka, która jedzie po krzywej. SCRUB: jog wheel (ta sama kula, znacznik osobno). */
  ball: "M100,30 C138.7,30 170,61.3 170,100 C170,138.7 138.7,170 100,170 C61.3,170 30,138.7 30,100 C30,61.3 61.3,30 100,30 Z",
  /** STAGGER: domino. */
  domino: "M72,22 H128 C136,22 142,28 142,36 V164 C142,172 136,178 128,178 H72 C64,178 58,172 58,164 V36 C58,28 64,22 72,22 Z",
  /** REVERSE: ślimak (niski korpus z lewej, muszla z prawej). */
  snail: "M18,154 C30,122 68,112 96,126 C98,84 148,60 174,96 C194,126 164,164 126,154 C92,164 52,166 24,164 C14,164 13,160 18,154 Z",
  /** COST w stanie jank: płomień. */
  flame: "M100,18 C122,50 152,74 152,116 C152,152 128,182 100,182 C72,182 48,152 48,116 C48,96 60,86 68,70 C74,92 88,98 92,88 C98,74 92,48 100,18 Z",
  /** YOURS: wybuch (Play, Copy). */
  burst: "M100,14 L118,70 L178,68 L132,104 L150,164 L100,130 L50,164 L68,104 L22,68 L82,70 Z",
} as const;

export type BlobShape = keyof typeof BLOB_SHAPES;

/** Kształt spoczynku per rozdział (SSR). Hero zostaje kroplą. */
export const CHAPTER_SHAPE: Record<ChapterId, BlobShape> = {
  hero: "base",
  position: "ticket",
  ease: "ball",
  stagger: "domino",
  scrub: "ball",
  reverse: "snail",
  cost: "base",
  yours: "base",
};

/** Rastr: odstęp i promień kropki w jednostkach viewBoxa, obrót spoczynku. */
export const BLOB_PATTERN = { size: 12, r: 2.4, rotate: 30 } as const;

/** Spirala muszli ślimaka (kreska rysowana DrawSVG). */
export const SNAIL_SPIRAL = "M142,112 C132,94 108,98 110,116 C112,130 130,134 138,124 C144,116 138,106 130,108";

/** Krzywa EASE w boxie 1000×400: x = czas, y = wartość (z zapasem na przestrzelenie back.out). */
export function easeCurvePath(name: EaseName, samples = 40): string {
  const pts = Array.from({ length: samples }, (_, i) => {
    const t = i / (samples - 1);
    return `${(t * 1000).toFixed(1)},${(340 - ease(name, t) * 280).toFixed(1)}`;
  });
  return `M${pts.join(" L")}`;
}

/** Znacznik czasu "0:00.90" → 0.9 s (ticki linijki hero w SSR). */
export const parseMark = (mark: string): number => {
  const m = /^(\d+):(\d+(?:\.\d+)?)$/.exec(mark.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
};
