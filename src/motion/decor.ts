// Dekoracje na scrollu (v7.1): numer rozdziału w konturze jedzie poziomo w kontrze do strony (co drugi
// w drugą stronę) i pochyla się z prędkością scrolla (velocitySkew z animaxxing: jedna powierzchnia na stronę,
// nigdy tekst do czytania). SCRUB jest przypięty, więc jego numer stoi. Reduced motion: numery stoją.
"use client";

import { ScrollTrigger, gsap, registerMotion } from "./register";
import { prefersReducedMotion } from "./reduced-motion";

export const DECOR = { travel: 14, maxSkew: 8, skewPer: 350 } as const;

export function createDecor(): () => void {
  registerMotion();
  if (prefersReducedMotion()) return () => {};
  const ctx = gsap.context(() => {
    const numerals = gsap.utils.toArray<HTMLElement>("[data-numeral]");
    const moving: HTMLElement[] = [];
    numerals.forEach((el, i) => {
      const section = el.closest<HTMLElement>("[data-chapter]");
      if (!section || section.dataset.chapter === "scrub") return;
      const dir = i % 2 ? 1 : -1;
      moving.push(el);
      gsap.fromTo(
        el,
        { xPercent: -DECOR.travel * dir },
        { xPercent: DECOR.travel * dir, ease: "none", scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true } },
      );
    });
    if (!moving.length) return;
    // Pochylenie z prędkości: quickSetter na skewX, osobna własność od xPercent (GSAP składa transform sam).
    const clamp = gsap.utils.clamp(-DECOR.maxSkew, DECOR.maxSkew);
    const lean = { skew: 0 };
    gsap.set(moving, { skewX: 0, transformOrigin: "50% 100%" });
    const setSkew = gsap.quickSetter(moving, "skewX", "deg");
    let settle: gsap.core.Tween | undefined;
    ScrollTrigger.create({
      onUpdate: (self) => {
        const skew = clamp(self.getVelocity() / -DECOR.skewPer);
        if (Math.abs(skew) <= Math.abs(lean.skew)) return;
        lean.skew = skew;
        settle?.kill();
        settle = gsap.to(lean, { skew: 0, duration: 0.8, ease: "power3.out", onUpdate: () => setSkew(lean.skew) });
      },
    });
  });
  return () => ctx.revert();
}
