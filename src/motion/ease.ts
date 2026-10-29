// EASE: onion skin. 12 kopii słowa rozstawionych w poziomie według easingu: pozycja kopii i = ease(i/11).
// Bez wykresu: gęstość kopii JEST krzywą. Intro przelatuje przez cztery układy na beat; spoczynek = expo.out
// (CSS, przez --p i translateX(calc(var(--p) * (100cqw - 100%))), więc istnieje bez JS).
"use client";

import { BEAT, gsap } from "./register";
import { EASE_NAMES, EASE_REST, layout, type EaseName } from "@/lib/eases";
import { easeCurvePath } from "@/lib/blob";
import { blobParts, blobRevert, patternPulse, type BlobParts } from "./blob";
import { footIntro } from "./foot";

export const EASE_STEP = 1.0;
export const EASE_FLY = 0.6;

function parts(root: HTMLElement) {
  const copies = Array.from(root.querySelectorAll<HTMLElement>("[data-onion] > *"));
  return {
    copies,
    stage: root.querySelector<HTMLElement>("[data-stage]")!,
    onion: root.querySelector<HTMLElement>("[data-onion]")!,
    playhead: root.querySelector<HTMLElement>("[data-playhead]"),
    buttons: Array.from(root.querySelectorAll<HTMLButtonElement>("[data-ease]")),
    curve: root.querySelector<SVGPathElement>("[data-ease-curve]"),
    ball: blobParts(root, "[data-ease-ball]"),
  };
}

/** Krzywa w boxie 1000×400: y = 340 − ease·280 (patrz easeCurvePath), kulka jedzie x liniowo, y z tym easingiem. */
const CURVE = { top: 60, bottom: 340, morph: 0.35 } as const;

/** Kulka przejeżdża krzywą: x liniowo (czas), y własnym easingiem (wartość). Pattern żyje w trakcie. */
function ride(tl: gsap.core.Timeline, ball: BlobParts, name: EaseName, at: number, duration: number): void {
  tl.set(ball.svg, { x: 0, y: CURVE.bottom }, at);
  tl.to(ball.svg, { x: 1000, duration, ease: "none" }, at);
  tl.to(ball.svg, { y: CURVE.top, duration, ease: name }, at);
  patternPulse(tl, ball, at, duration);
}

/** Spoczynek SVG jak z SSR: krzywa expo.out w całości, kulka na jej końcu. */
function revertScene(p: ReturnType<typeof parts>): void {
  if (p.curve) {
    gsap.killTweensOf(p.curve);
    gsap.set(p.curve, { clearProps: "strokeDasharray,strokeDashoffset" });
    p.curve.setAttribute("d", easeCurvePath(EASE_REST));
  }
  if (p.ball) {
    blobRevert(p.ball);
    p.ball.svg.setAttribute("transform", "translate(1000 60)");
  }
}

/** Przebieg x w px dla kopii: p * (szerokość sceny − szerokość kopii). */
function targets(root: HTMLElement, name: EaseName): number[] {
  const p = parts(root);
  const travel = p.onion.getBoundingClientRect().width - p.copies[0].getBoundingClientRect().width;
  return layout(name, p.copies.length).map((v) => v * travel);
}

export type EaseIntro = { timeline: gsap.core.Timeline; revert: () => void };

export function easeIntro(root: HTMLElement, { first = true }: { first?: boolean } = {}): EaseIntro {
  const p = parts(root);
  const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
  const touched = [...p.copies, ...(p.playhead ? [p.playhead] : [])];
  let foot: (() => void) | null = null;
  const revert = () => {
    gsap.set(touched, { clearProps: "transform,willChange" });
    revertScene(p);
    foot?.();
    foot = null;
  };
  try {
    // Start: wszystkie kopie w stosie na lewej krawędzi. Potem kolejne układy, na beat, z lekkim opóźnieniem po kopii.
    tl.set(p.copies, { x: 0 }, 0);
    // Krzywa rysuje się kreską jako linia prosta („none"), potem morfuje do każdego easingu tuż przed przelotem.
    if (p.curve) {
      tl.set(p.curve, { morphSVG: easeCurvePath("none") }, 0);
      tl.fromTo(p.curve, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.8, ease: "power2.inOut" }, 0);
      tl.set(p.curve, { clearProps: "strokeDasharray,strokeDashoffset" }, 0.82);
    }
    EASE_NAMES.forEach((name, i) => {
      const at = i * EASE_STEP;
      tl.addLabel(name, at);
      tl.to(p.copies, { x: (j: number) => targets(root, name)[j], duration: EASE_FLY, ease: BEAT, stagger: 0.02 }, at);
      tl.call(() => setPressed(root, name), [], at);
      if (p.curve && i > 0) tl.to(p.curve, { morphSVG: easeCurvePath(name), duration: CURVE.morph, ease: "power2.inOut" }, at - CURVE.morph);
      if (p.ball) ride(tl, p.ball, name, at + (i === 0 ? 0.2 : 0), EASE_FLY);
    });
    // Podpis i przyciski wchodzą z pierwszym przelotem.
    foot = footIntro(tl, root, 0.3, { first }).revert;
    const end = (EASE_NAMES.length - 1) * EASE_STEP + EASE_FLY + 0.02 * p.copies.length;
    tl.addLabel("end", end);
    if (p.playhead) {
      const travel = p.stage.getBoundingClientRect().width;
      tl.fromTo(p.playhead, { x: -travel }, { x: 0, duration: end, ease: "none" }, 0);
    }
  } catch (error) {
    tl.kill();
    revert();
    throw error;
  }
  return { timeline: tl, revert };
}

/** Przycisk: kopie przelatują do układu `name` na beat, krzywa morfuje, kulka przejeżdża. Kontroler ma być w spoczynku. */
export function easeLayout(root: HTMLElement, name: EaseName): gsap.core.Timeline {
  const p = parts(root);
  setPressed(root, name);
  const t = targets(root, name);
  const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
  // GSAP czyta start z macierzy CSS (translateX z --p) i od tej chwili sam jest właścicielem transformu: x jest absolutne.
  tl.to(p.copies, { x: (j: number) => t[j], duration: EASE_FLY, ease: BEAT, stagger: 0.02 }, 0);
  if (p.curve) tl.to(p.curve, { morphSVG: easeCurvePath(name), duration: CURVE.morph, ease: "power2.inOut" }, 0);
  if (p.ball) ride(tl, p.ball, name, 0.15, EASE_FLY);
  return tl;
}

export function setPressed(root: HTMLElement, name: EaseName): void {
  for (const b of parts(root).buttons) b.setAttribute("aria-pressed", String(b.dataset.ease === name));
}
