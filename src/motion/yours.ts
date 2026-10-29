// YOURS: widz dostaje timeline. Jedna linijka tl.to(".letter", { x, rotation, duration, ease }, position)
// z edytowalnymi polami, grana na literach słowa YOURS. Pola walidowane i ograniczone (x nie wypycha liter
// z kadru). Linijka kodu do skopiowania odzwierciedla aktualne wartości.
"use client";

import { gsap, registerMotion } from "./register";
import { prefersReducedMotion } from "./reduced-motion";
import { splitLetters, type Split } from "./split";
import { YOURS_DEFAULT, clampValues, codeLine, type YoursValues } from "@/lib/yours";
import { blobParts, blobRevert, blobTo, patternPulse } from "./blob";
import { BLOB_SHAPES } from "@/lib/blob";

const BLOB_BASE = BLOB_SHAPES.base;

export { YOURS_DEFAULT, YOURS_EASES, YOURS_POSITIONS, clampValues, codeLine } from "@/lib/yours";
export type { YoursValues } from "@/lib/yours";

export type YoursScene = {
  values: () => YoursValues;
  set: (raw: Partial<Record<keyof YoursValues, string | number>>) => YoursValues;
  play: () => void;
  reverse: () => void;
  /** Ile px może pojechać x w prawo / w lewo, żeby litery zostały w kadrze. */
  maxX: () => number;
  minX: () => number;
  /** Copy: błysk patternu bloba (potwierdzenie bez trzeciego koloru). */
  flash: () => void;
  destroy: () => void;
};

export function createYours(root: HTMLElement, onChange?: (v: YoursValues, line: string) => void): YoursScene {
  registerMotion();
  const word = root.querySelector<HTMLElement>('[data-word="yours"]')!;
  const stage = root.querySelector<HTMLElement>("[data-stage]")!;
  const blob = blobParts(root);
  let split: Split | null = null;
  let tl: gsap.core.Timeline | null = null;
  let values = YOURS_DEFAULT;

  const room = () => {
    // Zasięg glifów (Range), nie box bloku: h2 w kolumnie flex ma szerokość sceny.
    const rg = document.createRange();
    rg.selectNodeContents(word);
    const w = rg.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    return { right: Math.max(0, Math.round(s.right - w.right)), left: Math.max(0, Math.round(w.left - s.left)) };
  };
  const maxX = () => room().right;
  const minX = () => -room().left;

  const build = () => {
    tl?.kill();
    tl = null;
    if (!split) split = splitLetters(word);
    const letters = split.chars;
    tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
    letters.forEach((l, i) => {
      tl!.to(l, { x: values.x, rotation: values.rotation, duration: values.duration, ease: values.ease }, i === 0 ? 0 : values.position);
    });
    root.dataset.yoursDuration = tl.duration().toFixed(2);
    return tl;
  };

  const set = (raw: Partial<Record<keyof YoursValues, string | number>>) => {
    values = clampValues({ ...values, ...raw }, maxX(), minX());
    onChange?.(values, codeLine(values));
    if (tl) build();
    return values;
  };

  return {
    values: () => values,
    set,
    maxX,
    minX,
    flash: () => {
      if (!blob || prefersReducedMotion()) return;
      patternPulse(gsap.timeline(), blob, 0, 0.6);
    },
    play: () => {
      const t = build();
      root.dataset.yoursState = "playing";
      if (prefersReducedMotion()) {
        t.progress(1);
        root.dataset.yoursState = "end";
        return;
      }
      t.eventCallback("onComplete", () => (root.dataset.yoursState = "end"));
      t.play(0);
      // Twój blob: wybuch i powrót (jedyny elastic na tym ekranie), obrót o Twoje wartości Twoim easingiem.
      if (blob) {
        blobTo(blob, "burst", { duration: 0.3 }).to(blob.shape, { morphSVG: BLOB_BASE, duration: 0.9, ease: "elastic.out(1, 0.45)" }, 0.45);
        gsap.to(blob.svg, { rotation: values.rotation * 3, transformOrigin: "50% 50%", duration: values.duration, ease: values.ease, overwrite: "auto" });
      }
    },
    reverse: () => {
      if (!tl) return;
      root.dataset.yoursState = "reversing";
      if (prefersReducedMotion()) {
        tl.progress(0);
        root.dataset.yoursState = "start";
        return;
      }
      tl.eventCallback("onReverseComplete", () => (root.dataset.yoursState = "start"));
      tl.reverse();
      if (blob) gsap.to(blob.svg, { rotation: 0, duration: values.duration, ease: values.ease, overwrite: "auto" });
    },
    destroy: () => {
      tl?.kill();
      tl = null;
      split?.revert();
      split = null;
      if (blob) blobRevert(blob);
      delete root.dataset.yoursState;
      delete root.dataset.yoursDuration;
    },
  };
}
