import type { ReactNode } from "react";
import { BLOB_PATTERN, BLOB_SHAPES, CHAPTER_SHAPE, SNAIL_SPIRAL } from "@/lib/blob";
import type { ChapterId } from "@/lib/palette";
import s from "./Poster.module.scss";

/**
 * Blob-bohater rozdziału (SSR = kształt spoczynku, JS morfuje od kropli). Wypełnienie: rastr w farbie typografii
 * (pattern animowany w trakcie morfu), kontur w tej samej farbie. Dekoracja: aria-hidden, absolutna, poza układem.
 * `extra`: elementy rozdziału w tym samym viewBoxie (znacznik SCRUB, spirala ślimaka).
 */
export function Blob({ chapter, extra }: { chapter: ChapterId; extra?: ReactNode }) {
  const shape = CHAPTER_SHAPE[chapter];
  const pattern = `blob-pattern-${chapter}`;
  return (
    <svg className={s.blob} data-blob data-blob-rest={shape} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={pattern} data-blob-pattern patternUnits="userSpaceOnUse" width={BLOB_PATTERN.size} height={BLOB_PATTERN.size} patternTransform={`rotate(${BLOB_PATTERN.rotate}) scale(1)`}>
          <circle data-blob-dot cx={BLOB_PATTERN.size / 2} cy={BLOB_PATTERN.size / 2} r={BLOB_PATTERN.r} fill="var(--fg)" />
        </pattern>
      </defs>
      <path data-blob-shape d={BLOB_SHAPES[shape]} fill={`url(#${pattern})`} stroke="var(--fg)" strokeWidth="3" strokeLinejoin="round" />
      {chapter === "reverse" ? <path data-blob-spiral d={SNAIL_SPIRAL} fill="none" stroke="var(--fg)" strokeWidth="3" strokeLinecap="round" /> : null}
      {chapter === "scrub" ? <circle data-blob-mark cx="100" cy="46" r="9" fill="var(--fg)" /> : null}
      {extra}
    </svg>
  );
}

/** STAGGER: cztery duchy domina za blobem, przewracają się po nim ze staggerem. */
export function Dominoes() {
  return (
    <svg className={s.dominoes} data-dominoes viewBox="0 0 560 200" aria-hidden="true" focusable="false">
      {[0, 1, 2, 3].map((i) => (
        <path key={i} data-domino d={BLOB_SHAPES.domino} transform={`translate(${120 + i * 110} 0)`} fill="none" stroke="var(--fg)" strokeWidth="3" strokeDasharray="7 6" strokeLinejoin="round" />
      ))}
    </svg>
  );
}
