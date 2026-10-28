"use client";

import { useEffect } from "react";
import { motionReady, registerMotion } from "@/motion/register";
import { armRecovery, bootPending, fontsReady, handOff } from "@/motion/boot";

const OWNER = "fonts";
/** Krócej niż BOOT_DEADLINE: fonty są self-hostowane i preloadowane. */
const FONT_WAIT = 1500;

/**
 * Pierwszy właściciel bramki: display type (data-fonts-wait) zostaje ukryty do document.fonts.ready,
 * żeby pierwsza widoczna klatka miała już Anybody (0 przesunięć układu). Rejestruje też GSAP.
 */
export function MotionBoot() {
  useEffect(() => {
    registerMotion();
    const html = document.documentElement;
    // Dla testów i diagnostyki: krzywe z MOTION.md zarejestrowane bez błędu.
    html.dataset.motionReady = motionReady() ? "true" : "false";
    let alive = true;
    const reveal = () => {
      html.dataset.fonts = "ready";
    };
    if (bootPending()) {
      armRecovery(OWNER, reveal);
      fontsReady(FONT_WAIT).then(() => {
        if (!alive) return;
        reveal();
        handOff(OWNER);
      });
    } else {
      // Reduced motion albo deadline minął: nic nie jest ukryte. Oznacz gotowość fontów dla testów.
      document.fonts?.ready.then(() => alive && reveal());
    }
    return () => {
      alive = false;
    };
  }, []);
  return null;
}
