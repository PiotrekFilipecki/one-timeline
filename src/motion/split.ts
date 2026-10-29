// Podział na litery po document.fonts.ready, z szerokościami przypiętymi dokładnie (bez zaokrąglania).
// Revert przywraca oryginalny tekst (czytniki dostają aria-label przez SplitText, aria: "auto").
"use client";

import { SplitText, gsap, registerMotion } from "./register";

export type Split = {
  chars: HTMLElement[];
  /** Przywraca tekst i zdejmuje przypięte szerokości. Bezpieczne wielokrotnie. */
  revert: () => void;
};

/**
 * Dzieli element na litery. Wołaj dopiero po fontsReady(): wcześniejsze pomiary są z fallbacku.
 * `pinTo` przypina szerokość każdej litery do jej najszerszego stanu (np. wdth 150, wght 900) zanim
 * ruch zmieni osie fontu, więc sąsiedzi nigdy się nie przesuwają (MOTION.md, Reguły).
 * Bez `pinTo` litera dostaje swoją spoczynkową szerokość: transformy jej nie zmieniają, a wagi
 * i szerokości wolno wtedy ruszać tylko w dół (lżej / węziej).
 */
export function splitLetters(el: HTMLElement, { charsClass = "ch", pinTo }: { charsClass?: string; pinTo?: { stretch?: number; weight?: number } } = {}): Split {
  registerMotion();
  // Box słowa trzyma swoją niepodzieloną szerokość (dokładny float) przez cały czas splitu: suma liter
  // jako inline-blocków różni się od ciągłego tekstu o kilka 1/64 px (jednostka układu Chromium),
  // a to wystarczy, żeby harness widział ruch albo żeby ciasna linia przełamała się o słowo wcześniej.
  // Także dla bloków: w kolumnie flex z align-items: flex-end blok ma szerokość treści (REVERSE), więc i on się ruszał.
  const holdBox = true;
  const prevWidth = el.style.width;
  if (holdBox) el.style.width = `${el.getBoundingClientRect().width}px`;
  const split = SplitText.create(el, { type: "chars", charsClass, aria: "auto" });
  const chars = split.chars as HTMLElement[];
  let reverted = false;

  const prev = chars.map((c) => ({ stretch: c.style.fontStretch, weight: c.style.fontWeight }));
  for (const c of chars) {
    c.style.display = "inline-block";
    if (pinTo?.stretch != null) c.style.fontStretch = `${pinTo.stretch}%`;
    if (pinTo?.weight != null) c.style.fontWeight = String(pinTo.weight);
  }
  // Pomiar w najszerszym stanie, zapis dokładny: 276.6 px zostaje 276.6 px.
  const widths = chars.map((c) => c.getBoundingClientRect().width);
  chars.forEach((c, i) => {
    c.style.fontStretch = prev[i].stretch;
    c.style.fontWeight = prev[i].weight;
    c.style.width = `${widths[i]}px`;
    c.style.textAlign = "center";
  });

  const revert = () => {
    if (reverted) return;
    reverted = true;
    gsap.killTweensOf(chars);
    split.revert();
    if (holdBox) el.style.width = prevWidth;
  };
  return { chars, revert };
}
