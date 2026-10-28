// Sygnatura strony: cięcie przez literę. Osobny element (koło w kolorze litery, startujące z jej bounding
// boxa) rośnie na expo.in, aż wypełni kadr; w tej klatce dokument skacze do następnego rozdziału (kadr
// jest jednolity, więc skoku nie widać), koło znika i następny rozdział wchodzi na beat.
// Wstecz: koło pojawia się pełne, dokument skacze z powrotem, koło kurczy się z easeReverse do litery.
// W trakcie cięcia maks. 3 kolory: dwa pola i koło. Szybkie przejścia przez próg nie kolejkują.
"use client";

import { ScrollTrigger, gsap, registerMotion } from "./register";
import { prefersReducedMotion } from "./reduced-motion";

export const CUT = { grow: 0.6, ease: "expo.in" } as const;

export type CutOptions = {
  /** Litera (element), z której rośnie koło. */
  letter: () => HTMLElement;
  /** Koło (fixed, w kolorze następnego pola). */
  overlay: HTMLElement;
  /** Rozdział, do którego tniemy. Próg = jego górna krawędź. */
  next: HTMLElement;
  /** Gdzie w kadrze górna krawędź `next` wyzwala cięcie w dół (domyślnie 80 %). */
  start?: string;
  /** Gdzie w kadrze górna krawędź `next` wyzwala cięcie wstecz, przewijając w górę (domyślnie 20 %). */
  back?: string;
  /** Po zakryciu kadru w przód: skok dokumentu i start następnego rozdziału. */
  onCovered: () => void;
  /** Kadr zakryty, ale użytkownik przewinął już za `next` (szybki scroll): bez skoku, `next` ma stanąć w spoczynku. */
  onPassed?: () => void;
  /** Po zakryciu kadru w tył: skok dokumentu do poprzedniego rozdziału. */
  onUncover: () => void;
  onDone?: (direction: "forward" | "back") => void;
};

export type Cut = { destroy: () => void; readonly state: "before" | "cutting" | "after" };

export function createCut(opts: CutOptions): Cut {
  registerMotion();
  const { letter, overlay, next, start = "top 80%", back: backStart = "top 20%", onCovered, onPassed, onUncover, onDone } = opts;
  let state: "before" | "cutting" | "after" = "before";
  let shown: "before" | "after" = "before";
  let pending: "forward" | "back" | null = null;
  let tl: gsap.core.Timeline | null = null;
  let plays = 0;

  const html = document.documentElement;
  const report = () => {
    html.dataset.cutState = state;
    html.dataset.cutPlays = String(plays);
  };

  /** Geometria: koło startuje z bounding boxa litery i rośnie, aż zakryje najdalszy róg kadru. */
  const geometry = () => {
    const r = letter().getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const far = Math.hypot(Math.max(cx, vw - cx), Math.max(cy, vh - cy));
    return { size, cx, cy, scale: (far * 2) / size + 0.1 };
  };

  /** Gdzie jest próg względem dokumentu teraz: czy `next` jest już za progiem cięcia w dół. */
  const pastForward = () => next.getBoundingClientRect().top <= window.innerHeight * 0.8;
  const pastBack = () => next.getBoundingClientRect().top < window.innerHeight * 0.2;
  /** `next` jest jeszcze w kadrze (albo poniżej): skok na jego górę ma sens. Za nim: nie ściągamy użytkownika z powrotem. */
  const nextInView = () => next.getBoundingClientRect().bottom > 0;

  const finish = (direction: "forward" | "back") => {
    state = direction === "forward" ? "after" : "before";
    shown = state;
    report();
    onDone?.(direction);
    const want = pending;
    pending = null;
    // Po cięciu liczy się realna pozycja dokumentu, nie kolejka zdarzeń z trakcie.
    if (shown === "before" && (want === "forward" || pastForward())) forward();
    else if (shown === "after" && want === "back" && !pastBack()) back();
  };

  const forward = () => {
    if (state === "cutting") {
      pending = "forward";
      return;
    }
    if (shown === "after") return;
    if (prefersReducedMotion()) {
      onCovered();
      return finish("forward");
    }
    state = "cutting";
    plays++;
    report();
    const g = geometry();
    tl?.kill();
    tl = gsap.timeline({ easeReverse: true, defaults: { overwrite: "auto" } });
    tl.set(overlay, { left: g.cx - g.size / 2, top: g.cy - g.size / 2, width: g.size, height: g.size, scale: 0.6, autoAlpha: 1, transformOrigin: "50% 50%" })
      .to(overlay, { scale: g.scale, duration: CUT.grow, ease: CUT.ease })
      .call(() => {
        if (pastForward()) {
          // Kadr jest jednolity: skok dokumentu jest niewidoczny. Jeśli użytkownik już minął `next`, zostaje tam, gdzie jest.
          if (nextInView()) onCovered();
          else onPassed?.();
          gsap.set(overlay, { autoAlpha: 0 });
          finish("forward");
        } else {
          // Użytkownik wrócił nad próg w trakcie: koło kurczy się z powrotem do litery, bez skoku.
          pending = null;
          gsap.timeline()
            .to(overlay, { scale: 0.6, duration: CUT.grow, ease: "expo.out" })
            .set(overlay, { autoAlpha: 0 })
            .call(() => finish("back"));
        }
      });
  };

  const back = () => {
    if (state === "cutting") {
      pending = "back";
      return;
    }
    if (shown === "before") return;
    if (pastBack()) return; // zdążył już wrócić w dół
    if (prefersReducedMotion()) {
      onUncover();
      return finish("back");
    }
    state = "cutting";
    plays++;
    report();
    tl?.kill();
    // Najpierw pełne koło i skok dokumentu, potem pomiar litery w jej prawdziwym miejscu.
    gsap.set(overlay, { autoAlpha: 1, scale: 1, left: 0, top: 0, width: window.innerWidth, height: window.innerHeight, transformOrigin: "50% 50%" });
    onUncover();
    const g = geometry();
    tl = gsap.timeline({ easeReverse: true, defaults: { overwrite: "auto" } });
    tl.set(overlay, { left: g.cx - g.size / 2, top: g.cy - g.size / 2, width: g.size, height: g.size, scale: g.scale })
      .to(overlay, { scale: 0.6, duration: CUT.grow, ease: "expo.out" })
      .set(overlay, { autoAlpha: 0 })
      .call(() => finish("back"));
  };

  report();
  // Dwa progi: w dół tnie, gdy 20 % następnego rozdziału jest w kadrze; w górę, gdy zostało go 80 %.
  // Po skoku dokumentu oba progi są po właściwej stronie, więc szybkie przewijanie nie dubluje cięć.
  const triggers = [
    ScrollTrigger.create({ trigger: next, start, end: "bottom top", onEnter: forward }),
    ScrollTrigger.create({ trigger: next, start: backStart, end: "bottom top", onLeaveBack: back }),
  ];

  return {
    get state() {
      return state;
    },
    destroy: () => {
      for (const t of triggers) t.kill();
      tl?.kill();
      gsap.set(overlay, { clearProps: "all" });
      delete html.dataset.cutState;
      delete html.dataset.cutPlays;
    },
  };
}
