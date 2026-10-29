// Blob-bohater: pomocnicy dla builderów. Morf od kropli do kształtu rozdziału wchodzi do timeline'u intro
// (więc głowica go scrubuje), pattern (rastr w farbie typografii) obraca się i puchnie w trakcie morfu i wraca
// do stanu z SSR (pełny obrót, skala 1), więc spoczynek po JS = spoczynek bez JS.
"use client";

import { BEAT, gsap } from "./register";
import { BLOB_PATTERN, BLOB_SHAPES, type BlobShape } from "@/lib/blob";

export const BLOB = { morph: 0.9, spin: 360, swell: 1.4, dot: 3.6 } as const;

export type BlobParts = {
  svg: SVGSVGElement;
  shape: SVGPathElement;
  pattern: SVGPatternElement | null;
  dot: SVGCircleElement | null;
  rest: BlobShape;
};

export function blobParts(root: ParentNode, selector = "[data-blob]"): BlobParts | null {
  const svg = root.querySelector<SVGSVGElement>(selector);
  const shape = svg?.querySelector<SVGPathElement>("[data-blob-shape]");
  if (!svg || !shape) return null;
  const scope = svg.closest("svg") ?? svg;
  return {
    svg,
    shape,
    pattern: scope.querySelector<SVGPatternElement>("[data-blob-pattern]"),
    dot: scope.querySelector<SVGCircleElement>("[data-blob-dot]"),
    rest: (svg.dataset.blobRest as BlobShape) ?? "base",
  };
}

const patternAt = (deg: number, scale: number) => `rotate(${deg}) scale(${scale})`;

/** Pattern żyje w trakcie zmiany: pełny obrót i puchnięcie kropek, z powrotem do stanu SSR na końcu. */
export function patternPulse(tl: gsap.core.Timeline, p: BlobParts, at: number, duration: number = BLOB.morph): void {
  if (!p.pattern) return;
  const r0 = BLOB_PATTERN.rotate;
  tl.fromTo(p.pattern, { attr: { patternTransform: patternAt(r0, 1) } }, { attr: { patternTransform: patternAt(r0 + BLOB.spin / 2, BLOB.swell) }, duration: duration / 2, ease: "power2.in" }, at);
  tl.to(p.pattern, { attr: { patternTransform: patternAt(r0 + BLOB.spin, 1) }, duration: duration / 2, ease: "power2.out" }, at + duration / 2);
  if (p.dot) {
    tl.fromTo(p.dot, { attr: { r: BLOB_PATTERN.r } }, { attr: { r: BLOB.dot }, duration: duration / 2, ease: "power2.in" }, at);
    tl.to(p.dot, { attr: { r: BLOB_PATTERN.r }, duration: duration / 2, ease: "power2.out" }, at + duration / 2);
  }
}

/** Morf w timeline'ie: fromTo renderuje `from` od razu (kropla stoi, zanim intro zagra). Zwraca koniec. */
export function blobMorph(tl: gsap.core.Timeline, p: BlobParts, at: number, { from = "base" as BlobShape, to = p.rest, duration = BLOB.morph as number, ease = BEAT as string } = {}): number {
  tl.fromTo(p.shape, { morphSVG: BLOB_SHAPES[from] }, { morphSVG: BLOB_SHAPES[to], duration, ease }, at);
  patternPulse(tl, p, at, duration);
  return at + duration;
}

/** Osobny morf poza intro (jank COST, wybuch YOURS). */
export function blobTo(p: BlobParts, to: BlobShape, { duration = 0.5, ease = BEAT as string } = {}): gsap.core.Timeline {
  const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
  tl.to(p.shape, { morphSVG: BLOB_SHAPES[to], duration, ease }, 0);
  patternPulse(tl, p, 0, duration);
  return tl;
}

/** Spoczynek jak z SSR: kształt rozdziału, pattern w pozycji wyjściowej, bez transformów. */
export function blobRevert(p: BlobParts): void {
  gsap.killTweensOf([p.svg, p.shape, p.pattern, p.dot].filter(Boolean));
  p.shape.setAttribute("d", BLOB_SHAPES[p.rest]);
  p.pattern?.setAttribute("patternTransform", patternAt(BLOB_PATTERN.rotate, 1));
  p.dot?.setAttribute("r", String(BLOB_PATTERN.r));
  gsap.set([p.svg, p.shape], { clearProps: "transform,transformOrigin,opacity,visibility" });
}

/** Ambient (hero): oddech ze skalą i pauzą dłuższą niż ruch (MOTION.md: ambient rzadko, zawsze z pauzą). */
export function blobBreathe(p: BlobParts): () => void {
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.4, defaults: { transformOrigin: "50% 50%" } });
  tl.to(p.svg, { scale: 1.07, duration: 0.8, ease: "sine.inOut" }).to(p.svg, { scale: 1, duration: 0.9, ease: "sine.inOut" });
  if (p.pattern) tl.fromTo(p.pattern, { attr: { patternTransform: patternAt(BLOB_PATTERN.rotate, 1) } }, { attr: { patternTransform: patternAt(BLOB_PATTERN.rotate + 30, 1) }, duration: 1.7, ease: "sine.inOut" }, 0).to(p.pattern, { attr: { patternTransform: patternAt(BLOB_PATTERN.rotate, 1) }, duration: 0.01 });
  return () => {
    tl.kill();
    gsap.set(p.svg, { clearProps: "transform,transformOrigin" });
    p.pattern?.setAttribute("patternTransform", patternAt(BLOB_PATTERN.rotate, 1));
  };
}
