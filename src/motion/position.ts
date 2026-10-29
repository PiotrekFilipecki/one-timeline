// POSITION: dyptyk SEQUENCE nad OVERLAP. Jedna głowica przejeżdża przez oba słowa naraz; litery skaczą
// z wagą: góra "+=0" (każdy skok po lądowaniu poprzedniego), dół "<0.06" (każdy 0.06 s po starcie
// poprzedniego). Pod spodem dwie linijki kodu odsłaniane liniami w maskach (wejście z dołu). Bez outro:
// cięcie wstecz skacze pod zakryciem, więc wyjście nigdy nie byłoby widoczne (code review P4).
"use client";

import { BEAT, gsap } from "./register";
import { splitLetters, type Split } from "./split";
import { JUMP, jumpWithWeight } from "./jump";

const CLEAR = "transform,transformOrigin,opacity,visibility,fontStretch,fontWeight,clipPath,willChange";

export type PositionIntro = { timeline: gsap.core.Timeline; revert: () => void };

function parts(root: HTMLElement) {
  const one = (sel: string) => root.querySelector<HTMLElement>(sel)!;
  const all = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
  return {
    top: one('[data-word="sequence"]'),
    bottom: one('[data-word="overlap"]'),
    playhead: root.querySelector<HTMLElement>("[data-playhead]"),
    code: all('[data-line="code"] code'),
    stage: one("[data-stage]"),
  };
}

export function positionIntro(root: HTMLElement, { first }: { first: boolean }): PositionIntro {
  const p = parts(root);
  const splits: Split[] = [];
  const touched = new Set<HTMLElement>();
  const revert = () => {
    while (splits.length) splits.pop()!.revert();
    if (touched.size) gsap.set([...touched], { clearProps: CLEAR });
    touched.clear();
  };
  const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
  try {
    const top = splitLetters(p.top, { pinTo: { weight: 800 } });
    const bottom = splitLetters(p.bottom, { pinTo: { weight: 800 } });
    splits.push(top, bottom);
    for (const c of [...top.chars, ...bottom.chars]) touched.add(c);

    // Góra: "+=0", skok po skoku. Dół: "<0.06", skoki nachodzą (ripple).
    let t = 0;
    for (const c of top.chars) t += jumpWithWeight(tl, c, t);
    const topEnd = t + JUMP.settle;
    bottom.chars.forEach((c, i) => jumpWithWeight(tl, c, i * 0.06));

    // Głowica: hairline w kolorze typografii przejeżdża przez oba słowa w czasie górnego rzędu.
    if (p.playhead) {
      touched.add(p.playhead);
      // Spoczynek w CSS: prawa krawędź sceny. Intro jedzie od lewej krawędzi (x = -travel) do spoczynku (x = 0).
      const travel = p.stage.getBoundingClientRect().width;
      tl.fromTo(p.playhead, { x: -travel }, { x: 0, duration: t, ease: "none" }, 0);
    }

    // Linijki kodu: linie w maskach, z dołu.
    if (first && p.code.length) {
      for (const c of p.code) touched.add(c);
      tl.fromTo(p.code, { yPercent: 110 }, { yPercent: 0, duration: 0.4, ease: BEAT, stagger: 0.06 }, topEnd - 0.1);
    }
  } catch (error) {
    tl.kill();
    revert();
    throw error;
  }
  return { timeline: tl, revert };
}
