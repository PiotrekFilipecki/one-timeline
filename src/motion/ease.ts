// EASE: onion skin. 12 kopii słowa rozstawionych w poziomie według easingu: pozycja kopii i = ease(i/11).
// Bez wykresu: gęstość kopii JEST krzywą. Intro przelatuje przez cztery układy na beat; spoczynek = expo.out
// (CSS, przez --p i translateX(calc(var(--p) * (100cqw - 100%))), więc istnieje bez JS).
"use client";

import { BEAT, gsap } from "./register";
import { EASE_NAMES, layout, type EaseName } from "@/lib/eases";

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
  };
}

/** Przebieg x w px dla kopii: p * (szerokość sceny − szerokość kopii). */
function targets(root: HTMLElement, name: EaseName): number[] {
  const p = parts(root);
  const travel = p.onion.getBoundingClientRect().width - p.copies[0].getBoundingClientRect().width;
  return layout(name, p.copies.length).map((v) => v * travel);
}

export type EaseIntro = { timeline: gsap.core.Timeline; revert: () => void };

export function easeIntro(root: HTMLElement): EaseIntro {
  const p = parts(root);
  const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
  const touched = [...p.copies, ...(p.playhead ? [p.playhead] : [])];
  const revert = () => gsap.set(touched, { clearProps: "transform,willChange" });
  try {
    // Start: wszystkie kopie w stosie na lewej krawędzi. Potem kolejne układy, na beat, z lekkim opóźnieniem po kopii.
    tl.set(p.copies, { x: 0 }, 0);
    EASE_NAMES.forEach((name, i) => {
      const at = i * EASE_STEP;
      tl.addLabel(name, at);
      tl.to(p.copies, { x: (j: number) => targets(root, name)[j], duration: EASE_FLY, ease: BEAT, stagger: 0.02 }, at);
      tl.call(() => setPressed(root, name), [], at);
    });
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

/** Przycisk: kopie przelatują do układu `name` na beat. Osobny tween, kontroler ma być w spoczynku. */
export function easeLayout(root: HTMLElement, name: EaseName): gsap.core.Tween {
  const p = parts(root);
  setPressed(root, name);
  const t = targets(root, name);
  // GSAP czyta start z macierzy CSS (translateX z --p) i od tej chwili sam jest właścicielem transformu: x jest absolutne.
  return gsap.to(p.copies, { x: (j: number) => t[j], duration: EASE_FLY, ease: BEAT, stagger: 0.02, overwrite: "auto" });
}

export function setPressed(root: HTMLElement, name: EaseName): void {
  for (const b of parts(root).buttons) b.setAttribute("aria-pressed", String(b.dataset.ease === name));
}
