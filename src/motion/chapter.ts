// Kontroler cyklu życia rozdziału: start → intro → rest → outro → end.
// Jeden rozdział gra naraz. Wejście nowego przerywa poprzedni skokiem do spoczynku, nie kolejką.
// Szybkie przewinięcie przez kilka rozdziałów = kilka skoków. Unmount = kill + revert.
// Buildery tylko budują (zwracają timeline w pauzie); kontroler decyduje, kiedy grają.
"use client";

import { ScrollTrigger, gsap, registerMotion } from "./register";
import { prefersReducedMotion } from "./reduced-motion";
import { armRecovery, bootPending, disarm, handOff } from "./boot";

export type Phase = "start" | "intro" | "rest" | "outro" | "end";

export type ChapterBuild = {
  /** Timeline intro w pauzie, od stanu startowego do spoczynku. null = ten rozdział nie gra. */
  intro: () => gsap.core.Timeline | null;
  /** Timeline outro w pauzie, od spoczynku do końca. Domyślnie: brak outro, rozdział stoi. */
  outro?: () => gsap.core.Timeline | null;
  /** Sprzątanie builderów (revert splitów, clearProps). Wołane przy unmount i po recovery. */
  revert?: () => void;
};

export type ChapterOptions = {
  id: string;
  root: HTMLElement;
  build: ChapterBuild;
  /** Gdzie w kadrze rozdział uznaje się za „wszedł". */
  start?: string;
  end?: string;
  /** Opuszczenie kadru do góry gra outro (P1: cięcie wstecz). Domyślnie rozdział stoi. */
  outroOnLeaveBack?: boolean;
  onPhase?: (phase: Phase) => void;
};

export type ChapterController = {
  readonly phase: Phase;
  /** Gra intro od początku. W trakcie: restart. */
  play: () => void;
  /** Skok do spoczynku bez animacji (szybkie przewinięcie, reduced motion, recovery). */
  rest: () => void;
  /** Ustawia progress intro (głowica w P1). Po puszczeniu wołaj rest(). */
  seek: (progress: number) => void;
  destroy: () => void;
};

let performer: ChapterController | null = null;

/** Nowy występ zdejmuje poprzedni ze sceny: skok do spoczynku, nigdy kolejka. */
function claimStage(next: ChapterController): void {
  if (performer && performer !== next && performer.phase === "intro") performer.rest();
  performer = next;
}

export function createChapter(opts: ChapterOptions): ChapterController {
  registerMotion();
  const { id, root, build, start = "top 60%", end = "bottom 40%", outroOnLeaveBack = false, onPhase } = opts;
  let phase: Phase = "start";
  let intro: gsap.core.Timeline | null = null;
  let outro: gsap.core.Timeline | null = null;
  let trigger: ScrollTrigger | null = null;
  let destroyed = false;
  const owner = `chapter:${id}`;

  const setPhase = (p: Phase) => {
    phase = p;
    root.dataset.phase = p;
    onPhase?.(p);
  };

  const killIntro = () => {
    intro?.kill();
    intro = null;
  };
  const killOutro = () => {
    outro?.kill();
    outro = null;
  };

  const rest = () => {
    if (destroyed) return;
    killOutro();
    if (intro) {
      // progress(1) odgrywa końcowe wartości (spoczynek), potem timeline znika.
      intro.progress(1).kill();
      intro = null;
    }
    setPhase("rest");
    handOff(owner);
  };

  const play = () => {
    if (destroyed) return;
    if (prefersReducedMotion()) return rest();
    killOutro();
    killIntro();
    let tl: gsap.core.Timeline | null = null;
    try {
      tl = build.intro();
    } catch (error) {
      build.revert?.();
      rest();
      throw error;
    }
    if (!tl) return rest();
    intro = tl;
    tl.eventCallback("onComplete", () => {
      if (intro === tl) intro = null;
      setPhase("rest");
    });
    claimStage(controller);
    setPhase("intro");
    handOff(owner);
    tl.play(0);
  };

  const leave = () => {
    if (destroyed || phase === "start" || phase === "end") return;
    if (!build.outro) return;
    if (phase === "intro") rest();
    const tl = prefersReducedMotion() ? null : build.outro();
    if (!tl) {
      setPhase("end");
      return;
    }
    killOutro();
    outro = tl;
    setPhase("outro");
    tl.eventCallback("onComplete", () => {
      if (outro === tl) outro = null;
      setPhase("end");
    });
    tl.play(0);
  };

  const seek = (progress: number) => {
    if (destroyed) return;
    if (!intro) {
      const tl = build.intro();
      if (!tl) return;
      intro = tl;
      setPhase("intro");
    }
    intro.pause().progress(Math.min(1, Math.max(0, progress)));
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    disarm(owner);
    trigger?.kill();
    trigger = null;
    killIntro();
    killOutro();
    build.revert?.();
    delete root.dataset.phase;
    if (performer === controller) performer = null;
  };

  const controller: ChapterController = {
    get phase() {
      return phase;
    },
    play,
    rest,
    seek,
    destroy,
  };

  // Deadline bezpieczeństwa: jeśli intro nie ruszy przed deadline'em, rozdział zostaje odkryty w spoczynku.
  if (bootPending()) {
    armRecovery(owner, () => {
      killIntro();
      build.revert?.();
      setPhase("rest");
    });
  } else {
    handOff(owner);
  }

  setPhase("start");

  trigger = ScrollTrigger.create({
    trigger: root,
    start,
    end,
    onEnter: () => {
      if (phase === "start" || phase === "end") play();
    },
    onEnterBack: () => {
      if (phase !== "end") return;
      if (outroOnLeaveBack) play();
      else rest();
    },
    onLeaveBack: () => {
      if (outroOnLeaveBack) leave();
    },
    // Opuszczenie w dół nie robi nic: rozdział zagrał i stoi (PLAN §4).
  });

  // Rozdział już w kadrze przy starcie (reload w środku strony): ScrollTrigger woła onEnter sam.
  return controller;
}
