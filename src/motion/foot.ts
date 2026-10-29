// Stopka plakatu wchodzi razem ze słowem (v7.1 P5c, ruch wtórny): podpis odsłania się wycięciem z góry
// (clip-path, zero układu), linijki kodu wjeżdżają w maskach z dołu, przyciski rosną z podstawy. Tylko przy
// pierwszym odegraniu (`first`); replay i głowica grają samo słowo. Spoczynek = CSS (revert czyści wszystko).
"use client";

import { BEAT, gsap } from "./register";

export const FOOT = { line: 0.5, code: 0.4, codeStagger: 0.06, ui: 0.35, uiStagger: 0.04 } as const;

export type FootIntro = { touched: HTMLElement[]; revert: () => void };

export function footIntro(tl: gsap.core.Timeline, root: HTMLElement, at: number, { first }: { first: boolean }): FootIntro {
  const line = Array.from(root.querySelectorAll<HTMLElement>('[data-line="line"]'));
  const code = Array.from(root.querySelectorAll<HTMLElement>('[data-line="code"] code'));
  const ui = Array.from(root.querySelectorAll<HTMLElement>("[data-ease], [data-replay], [data-cost-mode], [data-cost-pause]"));
  const touched = [...line, ...code, ...ui];
  const revert = () => {
    if (touched.length) gsap.set(touched, { clearProps: "clipPath,transform,transformOrigin" });
  };
  if (!first) return { touched: [], revert };
  if (line.length) tl.fromTo(line, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: FOOT.line, ease: BEAT }, at);
  if (code.length) tl.fromTo(code, { yPercent: 110 }, { yPercent: 0, duration: FOOT.code, ease: BEAT, stagger: FOOT.codeStagger }, at + 0.1);
  if (ui.length) tl.fromTo(ui, { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: FOOT.ui, ease: BEAT, stagger: FOOT.uiStagger }, at + 0.2);
  return { touched, revert };
}
