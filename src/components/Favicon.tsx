"use client";

import { useEffect } from "react";
import { CHAPTERS } from "@/lib/palette";
import { gsap, registerMotion } from "@/motion/register";
import { prefersReducedMotion } from "@/motion/reduced-motion";

/** Klatek na sekundę w ikonie karty: więcej nie ma sensu (przeglądarki i tak odświeżają ikonę rzadko). */
const FPS = 12;
const SIZE = 64;
/** Jedno cięcie: koło następnego pola rośnie 0.9 s (expo.in, jak na stronie), potem twarde cięcie i 0.6 s stania. */
const GROW = 0.9;
const HOLD = 0.6;

/**
 * Animowany favicon (v7.1): sygnatura strony w 64 px. Pole w kolorze rozdziału N, koło w kolorze N+1 rośnie
 * z środka, zalewa kwadrat, następny rozdział. Rysowane na canvasie i podmieniane w <link rel="icon">.
 * Reduced motion albo karta w tle: ikona stoi. Bez JS: statyczny icon.svg z app/.
 */
export function Favicon() {
  useEffect(() => {
    registerMotion();
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link || prefersReducedMotion()) return;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const original = { href: link.href, type: link.type };
    link.type = "image/png";
    const period = GROW + HOLD;
    const expoIn = gsap.parseEase("expo.in");
    let last = -1;
    const draw = (t: number) => {
      const i = Math.floor(t / period) % CHAPTERS.length;
      const local = t - Math.floor(t / period) * period;
      const field = CHAPTERS[i].bg;
      const next = CHAPTERS[(i + 1) % CHAPTERS.length].bg;
      ctx.fillStyle = field;
      ctx.fillRect(0, 0, SIZE, SIZE);
      // Litera-aktor: kropka w farbie typografii, z której rośnie cięcie.
      ctx.fillStyle = CHAPTERS[i].fg;
      ctx.beginPath();
      ctx.arc(SIZE * 0.62, SIZE * 0.62, SIZE * 0.11, 0, Math.PI * 2);
      ctx.fill();
      if (local < GROW) {
        const r = expoIn(local / GROW) * SIZE * 0.95;
        ctx.fillStyle = next;
        ctx.beginPath();
        ctx.arc(SIZE * 0.62, SIZE * 0.62, r, 0, Math.PI * 2);
        ctx.fill();
      }
      link.href = canvas.toDataURL("image/png");
    };
    const tick = (time: number) => {
      if (document.hidden) return;
      const frame = Math.floor(time * FPS);
      if (frame === last) return;
      last = frame;
      draw(time);
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      link.href = original.href;
      link.type = original.type;
    };
  }, []);
  return null;
}
