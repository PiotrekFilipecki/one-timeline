// Hero: zdanie, w którym każde słowo odgrywa swój rozdział w miniaturze, potem stoi jako czysta typografia.
// Buildery tylko budują; kontroler rozdziału decyduje, kiedy grają. Znaczniki czasu słów są czytane z labeli.
"use client";

import { BEAT, gsap } from "./register";
import { splitLetters, type Split } from "./split";
import { jumpWithWeight } from "./jump";
import { openerExit } from "./opener";
import { openerWanted, markOpened } from "./boot";
import { formatTime } from "./format";
import { blobParts, blobRevert, patternPulse } from "./blob";

/** Starty słów na timeline hero (sekundy). Indeksy górne czytają je z labeli, nie z tej tabeli. */
export const HERO_MARKS: Record<string, number> = {
  sequence: 0,
  overlap: 0.9,
  ease: 1.6,
  stagger: 2.3,
  scrub: 3.1,
  reverse: 3.9,
};

/** Kadencje słów (s / znak), strojone w P1. MOTION.md: display 0.02–0.04 s / znak; „sequence" celowo wolniej
 *  (0.12), bo każdy skok z wagą ma być widoczny osobno; overlap, stagger i reverse 0.045–0.05 (odstęp między
 *  literami musi być krótszy niż ruch litery, żeby fale nachodziły). */
const CADENCE = { sequence: 0.12, overlap: 0.045, stagger: 0.05, scrub: 0.02, reverse: 0.05 } as const;

const CLEAR = "transform,transformOrigin,opacity,visibility,fontStretch,fontWeight,clipPath,willChange";

export type HeroIntro = { timeline: gsap.core.Timeline; revert: () => void };

function parts(root: HTMLElement) {
  const all = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
  const one = (sel: string) => root.querySelector<HTMLElement>(sel)!;
  return {
    h1: one("h1"),
    words: all("[data-word-key]"),
    type: (key: string) => one(`[data-word-key="${key}"] .t`),
    // sup jest rodzeństwem przycisku w boxie słowa [data-word], nie jego dzieckiem.
    sup: (key: string) => root.querySelector<HTMLElement>(`[data-word="${key}"] sup`),
    dot: one("[data-dot]"),
    line: one('[data-line="line"]'),
    replay: root.querySelector<HTMLElement>("[data-replay]"),
    // v7.1: linijka master timeline'u i blob (SVG: poza listą clearProps, własny revert).
    ruler: root.querySelector<SVGSVGElement>("[data-ruler]"),
    rulerLine: root.querySelector<SVGLineElement>("[data-ruler-line]"),
    rulerTicks: Array.from(root.querySelectorAll<SVGLineElement>("[data-ruler-tick]")),
    rulerHead: root.querySelector<SVGRectElement>("[data-ruler-head]"),
    blob: blobParts(root),
    // Paski openera stoją poza rozdziałem (fixed poza treścią smoothera, page.tsx).
    bars: Array.from(document.querySelectorAll<HTMLElement>("[data-opener-bars] > *")),
  };
}

/**
 * Buduje intro w pauzie. Wartości startowe idą na DOM od razu (immediateRender), więc wołaj po fontach,
 * zanim bramka puści. `first`: opener (jeśli pierwsze wejście w sesji) + linijka i Replay po zdaniu.
 * Replay odtwarza tylko zdanie.
 */
export function heroIntro(root: HTMLElement, { first }: { first: boolean }): HeroIntro {
  const p = parts(root);
  const splits: Split[] = [];
  const touched = new Set<HTMLElement>();
  const revert = () => {
    while (splits.length) splits.pop()!.revert();
    if (touched.size) gsap.set([...touched], { clearProps: CLEAR });
    touched.clear();
    for (const t of root.querySelectorAll<HTMLElement>("[data-mask]")) delete t.dataset.mask;
    // SVG wraca do stanu z SSR: linijka narysowana, głowica na końcu, ticki pełne, blob w spoczynku.
    if (p.rulerLine) gsap.set(p.rulerLine, { clearProps: "strokeDasharray,strokeDashoffset" });
    if (p.rulerHead) gsap.set(p.rulerHead, { x: 1000, y: 0 });
    for (const t of p.rulerTicks) t.setAttribute("y2", "8");
    if (p.blob) blobRevert(p.blob);
  };
  const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
  const touch = (...els: (HTMLElement | HTMLElement[] | null)[]) => {
    for (const e of els.flat()) if (e) touched.add(e);
  };

  try {
    let t0 = 0;
    const withOpener = first && openerWanted() && p.bars.length === 8;
    if (withOpener) {
      t0 = openerExit(tl, p.bars, 0);
      tl.call(markOpened, [], t0);
    } else {
      gsap.set(p.bars, { visibility: "hidden" });
    }

    const chars = (key: string, pinTo?: { stretch?: number; weight?: number }) => {
      const s = splitLetters(p.type(key), { pinTo });
      splits.push(s);
      touch(s.chars);
      return s.chars;
    };
    // Maska słowa (clip-path, nie overflow: overflow zmienia baseline inline-blocka). Zdejmowana przy revert.
    const masked: HTMLElement[] = [];
    const mask = (key: string) => {
      const t = p.type(key);
      t.dataset.mask = "";
      masked.push(t);
    };
    const unmask = () => {
      for (const t of masked) delete t.dataset.mask;
      masked.length = 0;
    };
    tl.eventCallback("onComplete", unmask);
    tl.eventCallback("onInterrupt", unmask);
    const at = (key: string) => {
      const time = t0 + HERO_MARKS[key];
      tl.addLabel(key, time);
      return time;
    };
    // Znacznik rośnie z podstawy (scaleY), bez fade-up.
    const mark = (key: string, after: number) => {
      const sup = p.sup(key);
      if (!sup) return;
      sup.textContent = formatTime(HERO_MARKS[key]);
      touch(sup);
      tl.fromTo(sup, { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.3, ease: BEAT }, after);
    };

    // Dot: stoi od początku z ostatnim słowem; przed nim ukryta.
    touch(p.dot);
    tl.set(p.dot, { autoAlpha: 0 }, 0);

    // sequence: litery skaczą po kolei, z wagą. Kadencja mini, skoki nachodzą na siebie.
    {
      const c = chars("sequence", { weight: 800 });
      const t = at("sequence");
      tl.set(c, { autoAlpha: 0 }, 0);
      c.forEach((el, i) => jumpWithWeight(tl, el, t + i * CADENCE.sequence, { appear: true }));
      mark("sequence", t + c.length * CADENCE.sequence + 0.2);
    }
    // overlap: jedna fala zza maski. Każda litera trwa dłużej niż odstęp do następnej, więc ruchy nachodzą.
    {
      const c = chars("overlap");
      const t = at("overlap");
      mask("overlap");
      tl.fromTo(c, { yPercent: 150 }, { yPercent: 0, duration: 0.55, ease: BEAT, stagger: CADENCE.overlap }, t);
      mark("overlap", t + 0.55 + CADENCE.overlap * c.length);
    }
    // ease: litery spadają razem zza górnej krawędzi maski i osiadają według krzywej beat.
    {
      const c = chars("ease");
      const t = at("ease");
      mask("ease");
      tl.fromTo(c, { yPercent: -140 }, { yPercent: 0, duration: 0.9, ease: BEAT }, t);
      mark("ease", t + 0.8);
    }
    // stagger: od środka, z podstawy (scaleY 0 = niewidoczna, bez alfy).
    {
      const c = chars("stagger");
      const t = at("stagger");
      tl.fromTo(c, { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.5, ease: BEAT, stagger: { each: CADENCE.stagger, from: "center" } }, t);
      mark("stagger", t + 0.5 + CADENCE.stagger * Math.ceil(c.length / 2));
    }
    // scrub: litery pojawiają się skondensowane (wdth 50) i rozciągają do spoczynku. Szerokości przypięte do spoczynku.
    {
      const c = chars("scrub", { stretch: 100 });
      const t = at("scrub");
      tl.set(c, { autoAlpha: 0 }, 0);
      tl.set(c, { autoAlpha: 1 }, t);
      tl.fromTo(c, { fontStretch: "50%" }, { fontStretch: "100%", duration: 0.7, ease: BEAT, stagger: CADENCE.scrub }, t);
      mark("scrub", t + 0.7);
    }
    // reverse: litery pojawiają się od końca i dosuwają z prawej, w odwrotnej kolejności.
    {
      const c = chars("reverse");
      const t = at("reverse");
      tl.set(c, { autoAlpha: 0 }, 0);
      [...c].reverse().forEach((el, i) => tl.set(el, { autoAlpha: 1 }, t + i * CADENCE.reverse));
      tl.fromTo(c, { xPercent: 40 }, { xPercent: 0, duration: 0.45, ease: BEAT, stagger: { each: CADENCE.reverse, from: "end" } }, t);
      const landed = t + 0.45 + CADENCE.reverse * c.length;
      tl.set(p.dot, { autoAlpha: 1 }, landed - 0.1);
      mark("reverse", landed);
    }

    // Linijka master timeline'u: kreska rysuje się w czasie rzeczywistym zdania, ticki wyrastają na znacznikach,
    // głowica jedzie od 0 do końca (DrawSVG; SSR ma wszystko narysowane).
    if (p.ruler && p.rulerLine && p.rulerHead) {
      const total = Number(p.ruler.dataset.rulerTotal) || 4.4;
      tl.fromTo(p.rulerLine, { drawSVG: "0%" }, { drawSVG: "100%", duration: total, ease: "none" }, t0);
      tl.fromTo(p.rulerHead, { x: 0 }, { x: 1000, duration: total, ease: "none" }, t0);
      for (const tick of p.rulerTicks) {
        const at = Number(tick.dataset.rulerAt) || 0;
        tl.fromTo(tick, { attr: { y2: 32 } }, { attr: { y2: 8 }, duration: 0.3, ease: BEAT }, t0 + at);
      }
    }
    // Blob-bohater wchodzi po zdaniu: wyrasta z podstawy (jedyny back.out na tym ekranie), pattern puchnie.
    if (p.blob) {
      const landed = t0 + HERO_MARKS.reverse + 0.9;
      tl.fromTo(p.blob.svg, { scale: 0, transformOrigin: "50% 100%" }, { scale: 1, duration: 0.6, ease: "back.out(2.2)" }, landed);
      patternPulse(tl, p.blob, landed, 0.6);
    }

    if (first) {
      // Linijka wchodzi w masce (linia z dołu), Replay rośnie w wagę. Nie fade-up.
      touch(p.line, p.replay);
      tl.fromTo(p.line, { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: BEAT }, ">-0.2");
      if (p.replay) tl.fromTo(p.replay, { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.4, ease: BEAT }, "<0.1");
    } else {
      gsap.set([p.line, p.replay], { clearProps: "all" });
    }
  } catch (error) {
    tl.kill();
    revert();
    throw error;
  }
  return { timeline: tl, revert };
}
