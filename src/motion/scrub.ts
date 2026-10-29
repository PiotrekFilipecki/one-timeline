// SCRUB: jedyny rozdział sterowany scrollem. Sekcja przypięta na jeden kadr; słowo rozciąga się wdth 50 → 150
// i ciężeje wght 100 → 900 w rytm scrolla (scrub 0.6 s). Litery przypięte do najszerszego stanu (150 / 900),
// więc sąsiedzi nigdy się nie przesuwają. Głowica pokazuje pozycję scrolla; przeciąganie przewija dokument.
"use client";

import { ScrollTrigger, gsap, registerMotion } from "./register";
import { prefersReducedMotion } from "./reduced-motion";
import { fontsReady } from "./boot";
import { splitLetters, type Split } from "./split";
import { yieldFrames } from "./chapter";

export const SCRUB_SMOOTH = 0.6;

export type ScrubScene = {
  readonly trigger: ScrollTrigger | null;
  /** 0..1 pozycja scrolla w przypiętym zakresie. */
  progress: () => number;
  /** Przewija dokument do progress (głowica). */
  seek: (p: number) => void;
  destroy: () => void;
};

export function createScrub(root: HTMLElement): ScrubScene {
  registerMotion();
  let split: Split | null = null;
  let tl: gsap.core.Timeline | null = null;
  let trigger: ScrollTrigger | null = null;
  let destroyed = false;
  const word = root.querySelector<HTMLElement>('[data-word="scrub"]')!;
  const playhead = root.querySelector<HTMLElement>("[data-playhead]");
  const stage = root.querySelector<HTMLElement>("[data-stage]")!;

  const build = async () => {
    await fontsReady(1500);
    if (destroyed || prefersReducedMotion()) return;
    // Pod kadrem przy starcie: split i pin o kilka klatek później niż rozdziały wyżej (patrz chapter.ts).
    if (root.getBoundingClientRect().top >= window.innerHeight) await yieldFrames(6);
    if (destroyed) return;
    split = splitLetters(word, { pinTo: { stretch: 150, weight: 900 } });
    tl = gsap.timeline({ paused: true, defaults: { ease: "none", overwrite: "auto" } });
    tl.fromTo(split.chars, { fontStretch: "50%", fontWeight: 100 }, { fontStretch: "150%", fontWeight: 900, duration: 1 }, 0);
    if (playhead) {
      const travel = stage.getBoundingClientRect().width;
      tl.fromTo(playhead, { x: -travel }, { x: 0, duration: 1 }, 0);
    }
    trigger = ScrollTrigger.create({
      id: "scrub:pin",
      trigger: root,
      start: "top top",
      end: "+=100%",
      pin: true,
      anticipatePin: 1,
      scrub: SCRUB_SMOOTH,
      animation: tl,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        root.dataset.scrub = self.progress.toFixed(3);
      },
    });
    // Pin-spacer przesuwa wszystko poniżej o 100 vh: triggery utworzone wcześniej (cięcia) muszą przeliczyć progi.
    ScrollTrigger.refresh();
    root.dataset.scrubReady = "";
  };
  void build();

  return {
    get trigger() {
      return trigger;
    },
    progress: () => trigger?.progress ?? 0.5,
    seek: (p) => {
      if (!trigger) return;
      const y = trigger.start + (trigger.end - trigger.start) * Math.min(1, Math.max(0, p));
      window.scrollTo({ top: y, behavior: "instant" });
    },
    destroy: () => {
      destroyed = true;
      trigger?.kill();
      trigger = null;
      tl?.kill();
      tl = null;
      split?.revert();
      split = null;
      if (playhead) gsap.set(playhead, { clearProps: "transform" });
      delete root.dataset.scrub;
      delete root.dataset.scrubReady;
    },
  };
}
