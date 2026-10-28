// Hover szerokości (animaxxing fontAxisHover): typ rośnie w szerz, box trzyma spoczynkową szerokość,
// zapisaną dokładnie (bez zaokrąglania). Focus = hover. Dotyk nigdy nie zostawia zawieszonego hovera.
"use client";

import { gsap } from "./register";
import { prefersReducedMotion } from "./reduced-motion";

export type AxisHover = { destroy: () => void };

/**
 * `box` trzyma szerokość (inline-block w CSS spoczynku), `type` rośnie w środku.
 * Hot: pointerenter (mysz) i focus-visible; cold: pointerleave, blur, pointercancel, touch.
 */
export function fontAxisHover(box: HTMLElement, type: HTMLElement, { stretch = 112, duration = 0.25 }: { stretch?: number; duration?: number } = {}): AxisHover {
  const rest = getComputedStyle(type).fontStretch;
  let held = false;
  let hot = false;
  const hold = () => {
    if (held) return;
    held = true;
    box.style.width = `${box.getBoundingClientRect().width}px`;
    box.style.textAlign = "center";
  };
  const release = () => {
    held = false;
    box.style.removeProperty("width");
    box.style.removeProperty("text-align");
  };
  const on = () => {
    if (hot) return;
    hot = true;
    hold();
    gsap.to(type, { fontStretch: `${stretch}%`, duration: prefersReducedMotion() ? 0 : duration, ease: "power3.out", overwrite: "auto" });
  };
  const off = () => {
    if (!hot) return;
    hot = false;
    gsap.to(type, { fontStretch: rest, duration: prefersReducedMotion() ? 0 : duration * 1.4, ease: "power3.out", overwrite: "auto", onComplete: release });
  };
  const enter = (e: PointerEvent) => {
    if (e.pointerType === "mouse") on();
  };
  const leave = () => {
    if (!box.matches(":focus-visible")) off();
  };
  const focus = () => {
    if (box.matches(":focus-visible")) on();
  };
  const blur = () => {
    if (!box.matches(":hover")) off();
  };
  box.addEventListener("pointerenter", enter);
  box.addEventListener("pointerleave", leave);
  box.addEventListener("pointercancel", leave);
  box.addEventListener("focus", focus);
  box.addEventListener("blur", blur);
  return {
    destroy: () => {
      box.removeEventListener("pointerenter", enter);
      box.removeEventListener("pointerleave", leave);
      box.removeEventListener("pointercancel", leave);
      box.removeEventListener("focus", focus);
      box.removeEventListener("blur", blur);
      gsap.killTweensOf(type);
      gsap.set(type, { clearProps: "fontStretch" });
      release();
    },
  };
}
