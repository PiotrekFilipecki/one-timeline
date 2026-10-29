// REVERSE: dyptyk dwóch wierszy tej samej frazy. Oba wchodzą na expo.out. Potem oba grają wstecz:
// wiersz A przez zwykłe cofnięcie playheada (ease odwrócony: expo.in, wyjście pełznie), wiersz B z
// easeReverse: true (wyjście zachowuje expo.out). Realne timeline'y GSAP, nie emulacja: chapter timeline
// prowadzi je przez tweenFromTo, więc głowica scrubuje całość. Głowica wraca w lewo podczas cofania.
"use client";

import { gsap } from "./register";
import { splitLetters, type Split } from "./split";

export const REVERSE = { enter: 0.8, hold: 0.5, back: 0.8, gap: 0.5 } as const;

function parts(root: HTMLElement) {
  const one = (sel: string) => root.querySelector<HTMLElement>(sel)!;
  return {
    a: one('[data-word="reverse-plain"]'),
    b: one('[data-word="reverse-eased"]'),
    stage: one("[data-stage]"),
    playhead: root.querySelector<HTMLElement>("[data-playhead]"),
  };
}

export type ReverseIntro = { timeline: gsap.core.Timeline; revert: () => void };

export function reverseIntro(root: HTMLElement): ReverseIntro {
  const p = parts(root);
  const splits: Split[] = [];
  const rows: gsap.core.Timeline[] = [];
  const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
  const masked = [p.a, p.b];
  const revert = () => {
    for (const r of rows) r.kill();
    rows.length = 0;
    while (splits.length) splits.pop()!.revert();
    for (const m of masked) delete m.dataset.mask;
    if (p.playhead) gsap.set(p.playhead, { clearProps: "transform" });
  };
  try {
    const a = splitLetters(p.a);
    const b = splitLetters(p.b);
    splits.push(a, b);
    for (const m of masked) m.dataset.mask = "";

    const rowA = gsap.timeline({ paused: true }).fromTo(a.chars, { yPercent: 110 }, { yPercent: 0, duration: REVERSE.enter, ease: "expo.out", stagger: 0.03 });
    const rowB = gsap.timeline({ paused: true }).fromTo(b.chars, { yPercent: 110 }, { yPercent: 0, duration: REVERSE.enter, ease: "expo.out", stagger: 0.03, easeReverse: true });
    rows.push(rowA, rowB);
    const d = rowA.duration();

    const t1 = 0;
    const t2 = d + REVERSE.hold;
    const t3 = t2 + d + REVERSE.gap;
    tl.addLabel("enter", t1).addLabel("reverse", t2).addLabel("again", t3);
    tl.add(rowA.tweenFromTo(0, d), t1).add(rowB.tweenFromTo(0, d), t1);
    // Wstecz: ten sam timeline cofany. A pełznie (expo.in), B zachowuje expo.out (easeReverse).
    tl.add(rowA.tweenFromTo(d, 0), t2).add(rowB.tweenFromTo(d, 0), t2);
    // Powrót do spoczynku (oba wiersze widoczne).
    tl.add(rowA.tweenFromTo(0, d), t3).add(rowB.tweenFromTo(0, d), t3);
    tl.addLabel("end", t3 + d);

    if (p.playhead) {
      const travel = p.stage.getBoundingClientRect().width;
      tl.fromTo(p.playhead, { x: -travel }, { x: 0, duration: d, ease: "none" }, t1)
        .to(p.playhead, { x: -travel, duration: d, ease: "none" }, t2)
        .to(p.playhead, { x: 0, duration: d, ease: "none" }, t3);
    }
  } catch (error) {
    tl.kill();
    revert();
    throw error;
  }
  return { timeline: tl, revert };
}
