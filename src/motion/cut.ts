// Sygnatura strony: cięcie przez literę. Osobny element (koło w kolorze następnego pola, startujące z bounding
// boxa litery) rośnie na expo.in, aż wypełni kadr; w tej klatce dokument skacze do następnego rozdziału (kadr
// jest jednolity, więc skoku nie widać), koło znika i następny rozdział wchodzi na beat.
// Wstecz: koło pojawia się pełne, dokument skacze z powrotem, koło kurczy się na expo.out (odwrócone expo.in,
// jak easeReverse). W trakcie cięcia maks. 3 kolory: dwa pola i koło. Szybkie przejścia przez próg nie
// kolejkują: w chwili zakrycia liczy się realna pozycja dokumentu.
// Progi liczone z pozycji w dokumencie względem celu scrolla przez koordynatora w cuts.ts (jeden nasłuch na stronę):
// ScrollTrigger nie przeliczał triggerów utworzonych przed pin-spacerem SCRUB (progi poniżej pinu o 100 vh
// za wcześnie), a przy skoku przez kilka progów naraz gra tylko najdalsze cięcie, wcześniejsze przechodzą cicho.
"use client";

import { gsap, registerMotion } from "./register";
import { prefersReducedMotion } from "./reduced-motion";
import { viewTop } from "./scroll";

export const CUT = { grow: 0.6, ease: "expo.in", forwardAt: 0.8, backAt: 0.2 } as const;

export type CutOptions = {
  /** Id cięcia (= id następnego rozdziału); stan trafia na <html data-cut-{id}>. */
  id: string;
  /** Kolor koła = pole następnego rozdziału. Ustawiany set(), nigdy tweenowany. */
  color: string;
  /** Bounding box litery, z której rośnie koło (mierzony w chwili cięcia). */
  rect: () => DOMRect;
  /** Koło (fixed). Jedno dla całej strony. */
  overlay: HTMLElement;
  /** Rozdział, do którego tniemy. Próg = jego górna krawędź. */
  next: HTMLElement;
  /** Po zakryciu kadru w przód: skok dokumentu i start następnego rozdziału. */
  onCovered: () => void;
  /** Użytkownik przewinął już za `next` (szybki scroll): bez koła, `next` ma stanąć w spoczynku. */
  onPassed?: () => void;
  /** Po zakryciu kadru w tył: skok dokumentu do poprzedniego rozdziału. */
  onUncover: () => void;
  onDone?: (direction: "forward" | "back") => void;
  /** Po zakończeniu cięcia koordynator sprawdza progi jeszcze raz. */
  onSettle?: () => void;
  /** Własny warunek progu w dół (pętla: koniec dokumentu). Domyślnie górna krawędź `next` ≤ 80 % kadru. */
  forwardWhen?: () => boolean;
  /** Własny warunek progu w tył. Domyślnie górna krawędź `next` < 20 % kadru. */
  backWhen?: () => boolean;
  /** Po cięciu w przód wróć cicho do stanu „przed" (pętla może zagrać znowu). */
  resetAfterForward?: boolean;
};

export type Cut = {
  destroy: () => void;
  readonly state: "before" | "cutting" | "after";
  readonly shown: "before" | "after";
  /** Próg w dół przekroczony (górna krawędź `next` ≤ 80 % kadru). */
  pastForward: () => boolean;
  /** Próg w tył: górna krawędź `next` wróciła poniżej 20 % kadru. */
  pastBack: () => boolean;
  forward: () => void;
  back: () => void;
  /** Cicho w stan „za": bez koła; `next` ma stanąć w spoczynku. */
  pass: () => void;
  /** Cicho w stan „przed": bez koła. */
  unpass: () => void;
};

export function createCut(opts: CutOptions): Cut {
  registerMotion();
  const { id, color, rect: letterRect, overlay, next, onCovered, onPassed, onUncover, onDone, onSettle, forwardWhen, backWhen, resetAfterForward = false } = opts;
  let state: "before" | "cutting" | "after" = "before";
  let shown: "before" | "after" = "before";
  let tl: gsap.core.Timeline | null = null;
  let destroyed = false;

  const html = document.documentElement;
  const report = () => {
    html.setAttribute(`data-cut-${id}`, state);
    html.dataset.cutPlays = html.dataset.cutPlays ?? "0";
    html.dataset.cutting = Array.from(html.attributes).some((a) => a.name.startsWith("data-cut-") && a.name !== "data-cut-plays" && a.value === "cutting") ? "true" : "false";
  };
  const countPlay = () => {
    html.dataset.cutPlays = String(Number(html.dataset.cutPlays ?? 0) + 1);
  };

  const vh = () => window.innerHeight;
  // Progi względem celu scrolla (viewTop), nie wygładzonej treści: patrz scroll.ts.
  const top = () => viewTop(next);
  const pastForward = () => (forwardWhen ? forwardWhen() : top() <= vh() * CUT.forwardAt);
  const pastBack = () => (backWhen ? backWhen() : top() < vh() * CUT.backAt);
  const nextInView = () => forwardWhen != null || top() + next.getBoundingClientRect().height > 0;

  /** Geometria: koło startuje z bounding boxa litery i rośnie, aż zakryje najdalszy róg kadru. */
  const geometry = () => {
    const r = letterRect();
    const size = Math.max(r.width, r.height);
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const far = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, vh() - cy));
    return { size, cx, cy, scale: (far * 2) / size + 0.1 };
  };

  const finish = (direction: "forward" | "back") => {
    state = direction === "forward" ? "after" : "before";
    shown = state;
    if (direction === "forward" && resetAfterForward) {
      state = "before";
      shown = "before";
    }
    report();
    onDone?.(direction);
    // Po cięciu liczy się realna pozycja dokumentu, nie kolejka zdarzeń z trakcie.
    onSettle?.();
  };

  const pass = () => {
    if (state === "cutting" || shown === "after" || destroyed) return;
    state = "after";
    shown = "after";
    onPassed?.();
    report();
  };
  const unpass = () => {
    if (state === "cutting" || shown === "before" || destroyed) return;
    state = "before";
    shown = "before";
    report();
  };

  const forward = () => {
    if (state === "cutting" || shown === "after" || destroyed) return;
    if (!nextInView()) return pass();
    if (prefersReducedMotion()) {
      state = "after";
      shown = "after";
      onCovered();
      report();
      return;
    }
    state = "cutting";
    countPlay();
    report();
    const g = geometry();
    tl?.kill();
    tl = gsap.timeline({ defaults: { overwrite: "auto" } });
    tl.set(overlay, { backgroundColor: color, left: g.cx - g.size / 2, top: g.cy - g.size / 2, width: g.size, height: g.size, scale: 0.6, autoAlpha: 1, transformOrigin: "50% 50%" })
      .to(overlay, { scale: g.scale, duration: CUT.grow, ease: CUT.ease })
      .call(() => {
        if (pastForward()) {
          // Kadr jest jednolity: skok dokumentu jest niewidoczny. Za rozdziałem: użytkownik zostaje, gdzie jest.
          if (nextInView()) onCovered();
          else onPassed?.();
          gsap.set(overlay, { autoAlpha: 0 });
          finish("forward");
        } else {
          // Użytkownik wrócił nad próg w trakcie: koło kurczy się z powrotem do litery, bez skoku.
          gsap.timeline()
            .to(overlay, { scale: 0.6, duration: CUT.grow, ease: "expo.out" })
            .set(overlay, { autoAlpha: 0 })
            .call(() => finish("back"));
        }
      });
  };

  const back = () => {
    if (state === "cutting" || shown === "before" || destroyed) return;
    if (prefersReducedMotion()) {
      state = "before";
      shown = "before";
      onUncover();
      report();
      return;
    }
    state = "cutting";
    countPlay();
    report();
    tl?.kill();
    // Najpierw pełne koło i skok dokumentu, potem pomiar litery w jej prawdziwym miejscu.
    gsap.set(overlay, { backgroundColor: color, autoAlpha: 1, scale: 1, left: 0, top: 0, width: window.innerWidth, height: vh(), transformOrigin: "50% 50%" });
    onUncover();
    const g = geometry();
    tl = gsap.timeline({ defaults: { overwrite: "auto" } });
    tl.set(overlay, { left: g.cx - g.size / 2, top: g.cy - g.size / 2, width: g.size, height: g.size, scale: g.scale })
      .to(overlay, { scale: 0.6, duration: CUT.grow, ease: "expo.out" })
      .set(overlay, { autoAlpha: 0 })
      .call(() => finish("back"));
  };

  // Stan początkowy z pozycji dokumentu (reload w środku strony): bez odgrywania.
  if (!resetAfterForward && pastForward()) {
    state = "after";
    shown = "after";
  }
  report();

  return {
    get state() {
      return state;
    },
    get shown() {
      return shown;
    },
    pastForward,
    pastBack,
    forward,
    back,
    pass,
    unpass,
    destroy: () => {
      destroyed = true;
      tl?.kill();
      gsap.set(overlay, { clearProps: "all" });
      html.removeAttribute(`data-cut-${id}`);
    },
  };
}
