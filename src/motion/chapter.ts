// Kontroler cyklu życia rozdziału: start → intro → rest → outro → end.
// prepare(): po fontach buduje intro w pauzie (wartości startowe już na DOM) i oddaje bramkę.
// Jeden rozdział gra naraz: wejście nowego przerywa poprzedni skokiem do spoczynku, nie kolejką.
// Buildery tylko budują (zwracają timeline w pauzie); kontroler decyduje, kiedy grają.
"use client";

import { ScrollTrigger, gsap, registerMotion } from "./register";
import { prefersReducedMotion } from "./reduced-motion";
import { armRecovery, bootPending, disarm, fontsReady, handOff } from "./boot";
import { registerChapter } from "./stage";

export type Phase = "start" | "intro" | "rest" | "outro" | "end";

export type IntroContext = {
  /** Pierwsze odegranie od zamontowania (UI wchodzi razem ze słowem). Replay = false. */
  first: boolean;
};

export type ChapterBuild = {
  /** Timeline intro w pauzie, od stanu startowego (immediateRender) do spoczynku. null = ten rozdział nie gra. */
  intro: (ctx: IntroContext) => gsap.core.Timeline | null;
  /** Timeline outro w pauzie, od spoczynku do końca. Domyślnie brak: rozdział stoi. */
  outro?: () => gsap.core.Timeline | null;
  /** Sprzątanie builderów (revert splitów, clearProps). Po każdym spoczynku, przy unmount i po recovery. */
  revert?: () => void;
};

export type ChapterOptions = {
  id: string;
  root: HTMLElement;
  build: ChapterBuild;
  /** Gdzie w kadrze rozdział uznaje się za „wszedł" (ScrollTrigger start). */
  start?: string;
  /** false = rozdział nie gra sam z wejścia w kadr (ktoś inny woła play(), np. cięcie). */
  autoplay?: boolean;
  /** Opuszczenie kadru do góry gra outro. Domyślnie rozdział stoi. */
  outroOnLeaveBack?: boolean;
  /** ms czekania na fonty przed splitem. */
  fontWait?: number;
  onPhase?: (phase: Phase) => void;
};

export type ChapterController = {
  readonly phase: Phase;
  /** Rozstrzyga się po przygotowaniu (fonty, intro w pauzie, trigger) albo po spoczynku z reduced motion. */
  readonly ready: Promise<void>;
  /** Gra intro od początku. W trakcie: restart. */
  play: () => void;
  /** Skok do spoczynku bez animacji (szybkie przewinięcie, reduced motion, recovery, puszczenie głowicy). */
  rest: () => void;
  /** Trzyma intro w progress (głowica). Buduje intro, jeśli trzeba. */
  seek: (progress: number) => void;
  /** Czas trwania intro w sekundach (0, gdy nie zbudowane). */
  duration: () => number;
  /** Dojeżdża do labela intro (przyciski EASE). Ostatni label = spoczynek. */
  goTo: (label: string) => void;
  destroy: () => void;
};

/** Próg „w kadrze" przy przygotowaniu: górna krawędź powyżej 60 % wysokości okna (jak domyślny `start`). */
const IN_VIEW = 0.6;

let performer: ChapterController | null = null;

/** Kolejka przygotowań rozdziałów pod kadrem: każdy następny buduje intro o klatkę później. */
let deferred = 0;
export const yieldFrames = (n: number): Promise<void> =>
  new Promise((r) => {
    const step = (k: number) => (k <= 0 ? r() : requestAnimationFrame(() => step(k - 1)));
    step(n);
  });

/** Nowy występ zdejmuje poprzedni ze sceny: skok do spoczynku, nigdy kolejka. */
function claimStage(next: ChapterController): void {
  if (performer && performer !== next && performer.phase === "intro") performer.rest();
  performer = next;
}

export function createChapter(opts: ChapterOptions): ChapterController {
  registerMotion();
  const { id, root, build, start = "top 60%", autoplay = true, outroOnLeaveBack = false, fontWait = 1500, onPhase } = opts;
  let phase: Phase = "start";
  let intro: gsap.core.Timeline | null = null;
  let outro: gsap.core.Timeline | null = null;
  let trigger: ScrollTrigger | null = null;
  let destroyed = false;
  let played = false;
  let ready: Promise<void> = Promise.resolve();
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

  /** Spoczynek: końcowe wartości, potem revert, więc CSS jest jedynym źródłem spoczynku. */
  const rest = () => {
    if (destroyed) return;
    killOutro();
    if (intro) {
      intro.progress(1).kill();
      intro = null;
    }
    build.revert?.();
    played = true;
    setPhase("rest");
    handOff(owner);
  };

  const buildIntro = (): gsap.core.Timeline | null => {
    killIntro();
    build.revert?.();
    try {
      intro = build.intro({ first: !played });
    } catch (error) {
      build.revert?.();
      rest();
      throw error;
    }
    return intro;
  };

  /** Intro gotowe do przewijania (głowica, przyciski EASE): istniejące w trakcie albo nowe od zera. */
  const ensureIntro = (): gsap.core.Timeline | null => {
    if (intro && intro.progress() < 1) return intro;
    killOutro();
    const tl = buildIntro();
    if (!tl) return null;
    claimStage(controller);
    setPhase("intro");
    return tl;
  };

  const play = () => {
    if (destroyed) return;
    if (prefersReducedMotion()) return rest();
    killOutro();
    const tl = buildIntro();
    if (!tl) return rest();
    tl.eventCallback("onComplete", () => {
      if (intro === tl) rest();
    });
    claimStage(controller);
    setPhase("intro");
    handOff(owner);
    tl.play(0);
  };

  const leave = () => {
    if (destroyed || phase === "start" || phase === "end" || !build.outro) return;
    if (phase === "intro") rest();
    const tl = prefersReducedMotion() ? null : build.outro();
    if (!tl) return setPhase("end");
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
    const tl = ensureIntro();
    if (!tl) return;
    tl.pause().progress(Math.min(1, Math.max(0, progress)));
  };

  const duration = () => intro?.duration() ?? 0;

  const goTo = (label: string) => {
    if (destroyed) return;
    const tl = ensureIntro();
    if (!tl || !(label in tl.labels)) return;
    if (prefersReducedMotion()) {
      tl.pause(tl.labels[label]);
      if (tl.labels[label] >= tl.duration()) rest();
      return;
    }
    tl.pause();
    tl.tweenTo(label, {
      onComplete: () => {
        if (intro === tl && tl.labels[label] >= tl.duration()) rest();
      },
    });
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    unregister();
    disarm(owner);
    trigger?.kill();
    trigger = null;
    killIntro();
    killOutro();
    build.revert?.();
    delete root.dataset.phase;
    if (performer === controller) performer = null;
  };

  /** Po przygotowaniu wejścia w kadr decyduje ScrollTrigger; szybkie przewinięcie obok = spoczynek, nie kolejka. */
  const createTrigger = (): ScrollTrigger =>
    ScrollTrigger.create({
      trigger: root,
      start,
      end: "bottom top",
      onEnter: () => {
        if (autoplay && (phase === "start" || phase === "end")) play();
      },
      onLeave: () => {
        if (phase === "start") rest();
      },
      onEnterBack: () => {
        if (phase !== "end") return;
        if (outroOnLeaveBack) play();
        else rest();
      },
      onLeaveBack: () => {
        if (outroOnLeaveBack) leave();
        else if (phase === "start") rest();
      },
    });

  /** Położenie w chwili przygotowania (reload w środku strony): nad kadrem = spoczynek; w kadrze = gra albo
   *  (bez autoplay, np. POSITION) spoczynek; pod kadrem = czeka na trigger. */
  const settleFromViewport = () => {
    const rect = root.getBoundingClientRect();
    if (rect.bottom <= 0) rest();
    else if (rect.top < window.innerHeight * IN_VIEW) {
      if (autoplay) play();
      else rest();
    }
  };

  /** Po fontach: stan startowy na DOM, bramka oddana, potem decyzja z pozycji w kadrze.
   *  Rozdział pod kadrem oddaje bramkę od razu (nie jest widoczny) i buduje intro o kilka klatek później,
   *  żeby start strony nie robił jednej długiej klatki ze wszystkich splitów naraz. */
  const prepare = async (): Promise<void> => {
    await fontsReady(fontWait);
    if (destroyed) return;
    if (prefersReducedMotion()) return rest();
    if (root.getBoundingClientRect().top >= window.innerHeight) {
      handOff(owner);
      await yieldFrames(++deferred);
      // Cięcie mogło już zagrać ten rozdział (szybki scroll tuż po starcie): nie nadpisuj trwającego intro.
      if (destroyed || phase !== "start") return;
    }
    const tl = buildIntro();
    if (!tl) return rest();
    tl.pause(0);
    handOff(owner);
    settleFromViewport();
    trigger = createTrigger();
  };

  const controller: ChapterController = {
    get phase() {
      return phase;
    },
    get ready() {
      return ready;
    },
    play,
    rest,
    seek,
    duration,
    goTo,
    destroy,
  };
  const unregister = registerChapter(id, controller);

  // Deadline bezpieczeństwa: jeśli przygotowanie nie zdąży, rozdział zostaje odkryty w spoczynku.
  if (bootPending()) {
    armRecovery(owner, () => {
      killIntro();
      build.revert?.();
      played = true;
      setPhase("rest");
    });
  }
  setPhase("start");
  ready = prepare();

  return controller;
}
