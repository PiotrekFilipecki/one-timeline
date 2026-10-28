// Opener na load: osiem pól palety jako osiem pasków naraz (nie osiem błysków: WCAG 2.3.1 pozwala
// na maks. 3 zmiany pola na sekundę, a 8 cięć w 0.8 s to 10/s). Paski stoją chwilę, potem wychodzą
// w górę po kolei na beat-exit i odsłaniają róż hero. Jeden punkt ekranu zmienia kolor dokładnie raz.
"use client";

import { BEAT_EXIT, gsap } from "./register";

export const OPENER = { hold: 0.22, exit: 0.3, stagger: 0.045 } as const;

/** Zwraca czas (s), po którym pole hero jest w całości odsłonięte. Paski zostają ukryte po wyjściu. */
export function openerExit(tl: gsap.core.Timeline, bars: HTMLElement[], at: number): number {
  tl.set(bars, { yPercent: 0, visibility: "visible" }, at)
    .to(bars, { yPercent: -101, duration: OPENER.exit, ease: BEAT_EXIT, stagger: OPENER.stagger }, at + OPENER.hold)
    .set(bars, { visibility: "hidden" });
  return at + OPENER.hold + OPENER.exit + OPENER.stagger * (bars.length - 1);
}
