// Sygnaturowy ruch MOTION.md: skok z wagą. Antycypacja (scaleY 0.8, scaleX 1.12) → strzał w górę
// ze stretchem i lżejszą wagą → opad → squash przy lądowaniu z pełną wagą → osiadanie na back.out.
// Jeden skok = JUMP_LAND sekund do lądowania; osiadanie wystaje poza ten czas i może nachodzić na następny.
"use client";

import { gsap } from "./register";

export const JUMP = {
  antic: 0.06,
  up: 0.1,
  down: 0.08,
  settle: 0.18,
  /** Czas od startu do lądowania: tyle liczy "+=0" w sekwencji. */
  land: 0.24,
  height: "-0.45em",
  lightWeight: 500,
} as const;

export type JumpOptions = {
  /** Waga w spoczynku (po lądowaniu). */
  restWeight?: number;
  /** Litera pojawia się w chwili startu (autoAlpha 0 → 1). */
  appear?: boolean;
  height?: string;
};

/** Dodaje skok elementu do timeline'u w pozycji `at`. Zwraca czas lądowania (sekundy od at). */
export function jumpWithWeight(tl: gsap.core.Timeline, el: gsap.TweenTarget, at: number, { restWeight = 800, appear = false, height = JUMP.height }: JumpOptions = {}): number {
  const origin = { transformOrigin: "50% 100%" };
  if (appear) tl.set(el, { autoAlpha: 1 }, at);
  tl.to(el, { scaleY: 0.8, scaleX: 1.12, ...origin, duration: JUMP.antic, ease: "power2.in" }, at)
    .to(el, { y: height, scaleY: 1.12, scaleX: 0.9, fontWeight: JUMP.lightWeight, duration: JUMP.up, ease: "power2.out" }, at + JUMP.antic)
    .to(el, { y: 0, scaleY: 0.82, scaleX: 1.16, fontWeight: restWeight, duration: JUMP.down, ease: "power2.in" }, at + JUMP.antic + JUMP.up)
    .to(el, { scaleY: 1, scaleX: 1, duration: JUMP.settle, ease: "back.out(2.2)" }, at + JUMP.land);
  return JUMP.land;
}
