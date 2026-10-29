// Jeden scroller na dokument (v7.1): ScrollSmoother przesuwa treść transformem i czyta data-speed / data-lag.
// Dotyk zostaje natywny (smoothTouch: false), reduced motion = bez smoothera. Wszystko, co skacze po
// dokumencie (cięcia, głowica SCRUB), idzie przez jumpTo(): przy smootherze window.scrollTo() ustawiłoby
// tylko pasek, a treść dojeżdżałaby jeszcze sekundę po zdjęciu koła.
"use client";

import { ScrollSmoother, registerMotion } from "./register";
import { prefersReducedMotion } from "./reduced-motion";

/** Sekundy, w które treść dogania pasek przewijania. */
export const SMOOTH = 1;

let smoother: ScrollSmoother | null = null;
const listeners = new Set<() => void>();

/** Tworzony raz, z powłoki strony, zanim rozdziały zbudują ScrollTriggery (one czekają na fonty). */
export function createSmoothScroll(wrapper: HTMLElement, content: HTMLElement): () => void {
  registerMotion();
  if (smoother || prefersReducedMotion()) return () => {};
  const html = document.documentElement;
  try {
    smoother = ScrollSmoother.create({
      wrapper,
      content,
      smooth: SMOOTH,
      effects: true,
      smoothTouch: false,
      ignoreMobileResize: true,
      onUpdate: () => {
        for (const l of listeners) l();
      },
    });
  } catch (error) {
    console.error("[motion] ScrollSmoother failed; native scroll stays", error);
    smoother = null;
    return () => {};
  }
  html.dataset.smooth = "";
  return () => {
    smoother?.kill();
    smoother = null;
    delete html.dataset.smooth;
  };
}

export const getSmoother = (): ScrollSmoother | null => smoother;

/** Treść ruszyła (także gdy pasek już stoi): koordynator cięć sprawdza progi. */
export function onScrollUpdate(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Skok dokumentu bez animacji (pod zakryciem koła, głowica SCRUB). */
export function jumpTo(y: number): void {
  if (smoother) smoother.scrollTo(Math.max(0, y), false);
  else window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
}

/** Bieżąca pozycja treści (przy smootherze: wygładzona, nie pasek). */
export const currentScroll = (): number => (smoother ? smoother.scrollTop() : window.scrollY);

/** Pozycja elementu w dokumencie: rect + wygładzony scroll, więc stała także w trakcie dojeżdżania treści.
 *  (ScrollSmoother.offset() tworzy i zabija ScrollTrigger przy każdym wywołaniu: za drogie na nasłuch scrolla.) */
export const scrollPositionOf = (el: HTMLElement): number => el.getBoundingClientRect().top + currentScroll();

/** Górna krawędź elementu względem kadru TAM, GDZIE TREŚĆ JEST TERAZ (to, co widz widzi), nie gdzie jedzie pasek.
 *  Wersja „od celu" (pasek) strzelała cięciem przy pierwszym ruchu flicku trackpada, zanim treść dojechała:
 *  cel ucieka o sekundę przed obraz, a bezwładność po skoku od razu dociągała następny próg (chaos z 29.10). */
export const viewTop = (el: HTMLElement): number => el.getBoundingClientRect().top;

/** Wstrzymanie scrolla na czas cięcia: smoother w pauzie zjada bezwładność trackpada, więc jeden flick = jedno
 *  cięcie, a następne wymaga nowego gestu. Skoki przez jumpTo() działają także w pauzie. Bez smoothera: nic. */
export function holdScroll(on: boolean): void {
  if (!smoother) return;
  const html = document.documentElement;
  if (on) {
    smoother.paused(true);
    html.dataset.scrollHold = "";
  } else {
    // Zwolnienie: pasek równo z treścią, żeby zjedzona bezwładność nie wróciła jako skok.
    smoother.scrollTo(smoother.scrollTop(), false);
    smoother.paused(false);
    delete html.dataset.scrollHold;
  }
}
