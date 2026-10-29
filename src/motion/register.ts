// Jedyny moduł, który importuje gsap i pluginy. Tylko po stronie klienta.
// Rejestruje krzywe z MOTION.md raz, zanim zbuduje się pierwszy timeline.
"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";

/** Wszystkie wejścia. Szybki atak, ~6% przestrzelenia. */
export const BEAT = "beat";
/** Wszystkie wyjścia. Wolny start, szybki koniec, zero przestrzelenia. */
export const BEAT_EXIT = "beat-exit";

let registered = false;

/**
 * Idempotentne. Każdy builder i kontroler woła to sam (useGSAP dzieci biegnie przed efektem MotionBoot).
 * Błąd rejestracji (np. zła ścieżka CustomEase) nie może zrzucić strony: SSR zostaje czytelny.
 */
export function registerMotion(): void {
  if (registered || typeof window === "undefined") return;
  try {
    gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, CustomEase);
    CustomEase.create(BEAT, "M0,0 C0.18,0 0.12,1.12 0.46,1.05 0.7,1.01 0.85,1 1,1");
    CustomEase.create(BEAT_EXIT, "M0,0 C0.6,0 0.88,0.35 1,1");
    gsap.defaults({ overwrite: "auto" });
    registered = true;
  } catch (error) {
    console.error("[motion] registerMotion failed; the page stays at rest", error);
  }
}

/** Czy krzywe z MOTION.md są zarejestrowane (test i diagnostyka). */
export const motionReady = (): boolean => registered;

/** Tylko do testów i diagnostyki: podgląd triggerów z Playwrighta. Nie używać w kodzie strony. */
if (typeof window !== "undefined") (window as unknown as { __otScrollTrigger?: typeof ScrollTrigger }).__otScrollTrigger = ScrollTrigger;

export { gsap, ScrollTrigger, SplitText, CustomEase, useGSAP };
