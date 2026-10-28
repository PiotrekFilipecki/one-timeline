// Podział na litery po document.fonts.ready, z szerokościami przypiętymi dokładnie (bez zaokrąglania).
// Revert przywraca oryginalny tekst (czytniki ekranu dostają aria-label przez SplitText, aria: "auto").
"use client";

import { SplitText, gsap, registerMotion } from "./register";

export type Split = {
  chars: HTMLElement[];
  words: HTMLElement[];
  /** Przywraca tekst i zdejmuje przypięte szerokości. Bezpieczne wielokrotnie. */
  revert: () => void;
};

/**
 * Dzieli element na litery. Wołaj dopiero po fontsReady(): wcześniejsze pomiary są z fallbacku.
 * `pinTo` przypina szerokość każdej litery do jej najszerszego stanu (np. wdth 150) zanim ruch
 * zmieni osie fontu, więc sąsiedzi nigdy się nie przesuwają (MOTION.md, Reguły).
 */
export function splitLetters(
  el: HTMLElement,
  { charsClass = "ch", wordsClass = "w", pinTo }: { charsClass?: string; wordsClass?: string; pinTo?: { wdth?: number; wght?: number } } = {},
): Split {
  registerMotion();
  const split = SplitText.create(el, { type: "chars,words", charsClass, wordsClass, aria: "auto" });
  const chars = split.chars as HTMLElement[];
  const words = split.words as HTMLElement[];
  let reverted = false;

  if (pinTo) {
    // Pomiar w najszerszym stanie, zapis dokładny: 276.6 px zostaje 276.6 px.
    const fvs = [pinTo.wdth != null ? `"wdth" ${pinTo.wdth}` : "", pinTo.wght != null ? `"wght" ${pinTo.wght}` : ""].filter(Boolean).join(", ");
    const prev = chars.map((c) => c.style.fontVariationSettings);
    for (const c of chars) {
      c.style.display = "inline-block";
      c.style.fontVariationSettings = fvs;
    }
    const widths = chars.map((c) => c.getBoundingClientRect().width);
    chars.forEach((c, i) => {
      c.style.fontVariationSettings = prev[i];
      c.style.width = `${widths[i]}px`;
      c.style.textAlign = "center";
    });
  } else {
    // Bez ruchu osi: tylko blok, żeby transform działał; szerokość zostaje naturalna.
    for (const c of chars) c.style.display = "inline-block";
  }

  const revert = () => {
    if (reverted) return;
    reverted = true;
    gsap.killTweensOf([...chars, ...words]);
    split.revert();
  };
  return { chars, words, revert };
}
