// Sygnatura strony między każdą parą rozdziałów: cięcie przez literę. Jedna konfiguracja, jedno koło
// (kolor następnego pola ustawiany set(), nigdy tweenowany). Litera tnąca per rozdział: ta, która
// prowadzi kompozycję (wybór i powód w devlogu P2). Litery mierzone przez Range na węzłach tekstowych,
// więc działa i na tekście w spoczynku, i w trakcie splitu.
"use client";

import { chapter, type ChapterId } from "@/lib/palette";
import { createCut, type Cut } from "./cut";
import { getChapter } from "./stage";

export type CutSpec = {
  from: ChapterId;
  to: ChapterId;
  /** Selektor słowa w rozdziale `from` i indeks litery w jego tekście. `index: -1` = ostatnia. */
  word: string;
  index: number;
};

export const CUTS: readonly CutSpec[] = [
  { from: "hero", to: "position", word: "[data-dot]", index: 0 },
  { from: "position", to: "ease", word: '[data-word="overlap"]', index: 0 },
  { from: "ease", to: "stagger", word: '[data-word="ease"]', index: 3 },
  { from: "stagger", to: "scrub", word: '[data-word="stagger"]', index: -1 },
  { from: "scrub", to: "reverse", word: '[data-word="scrub"]', index: 4 },
  { from: "reverse", to: "cost", word: '[data-word="reverse-eased"]', index: 0 },
];

/** Bounding box i-tej widocznej litery w tekście elementu (bez białych znaków). */
export function letterRect(el: HTMLElement, index: number): DOMRect {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const parent = (n as Text).parentElement;
      if (!parent || getComputedStyle(parent).display === "none") return NodeFilter.FILTER_REJECT;
      return /\S/.test(n.textContent ?? "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  const letters: { node: Text; offset: number }[] = [];
  for (const node of nodes) {
    const text = node.textContent ?? "";
    for (let i = 0; i < text.length; i++) if (/\S/.test(text[i])) letters.push({ node, offset: i });
  }
  const pick = letters[index < 0 ? letters.length + index : index] ?? letters[letters.length - 1];
  if (!pick) return el.getBoundingClientRect();
  const range = document.createRange();
  range.setStart(pick.node, pick.offset);
  range.setEnd(pick.node, pick.offset + 1);
  const r = range.getBoundingClientRect();
  return r.width > 0 ? r : el.getBoundingClientRect();
}

/** Pozycja elementu w dokumencie. offsetTop zawodzi wewnątrz pin-spacera ScrollTriggera (position: relative). */
export const docTop = (el: HTMLElement): number => el.getBoundingClientRect().top + window.scrollY;

/**
 * Jeden nasłuch scrolla dla wszystkich cięć. Przy przejściu przez kilka progów naraz (skok, szybki scroll)
 * w dół gra tylko najdalsze cięcie, wcześniejsze przechodzą cicho; w górę gra tylko najbliższe hero,
 * dalsze wracają cicho. Dzięki temu dwa cięcia nigdy nie walczą o jedno koło ani o pozycję dokumentu.
 */
export function createCuts(overlay: HTMLElement): () => void {
  const cuts: Cut[] = [];
  let raf = 0;
  const check = () => {
    if (cuts.some((c) => c.state === "cutting")) return;
    const forwardIdx = cuts.map((c, i) => (c.shown === "before" && c.pastForward() ? i : -1)).filter((i) => i >= 0);
    if (forwardIdx.length) {
      const last = forwardIdx[forwardIdx.length - 1];
      for (const i of forwardIdx) if (i !== last) cuts[i].pass();
      cuts[last].forward();
      return;
    }
    const backIdx = cuts.map((c, i) => (c.shown === "after" && !c.pastBack() ? i : -1)).filter((i) => i >= 0);
    if (backIdx.length) {
      const first = backIdx[0];
      for (const i of backIdx) if (i !== first) cuts[i].unpass();
      cuts[first].back();
    }
  };
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      check();
    });
  };
  for (const spec of CUTS) {
    const from = document.querySelector<HTMLElement>(`[data-chapter="${spec.from}"]`);
    const next = document.querySelector<HTMLElement>(`[data-chapter="${spec.to}"]`);
    if (!from || !next) continue;
    const color = chapter(spec.to).bg;
    cuts.push(
      createCut({
        id: spec.to,
        color,
        rect: () => {
          const word = from.querySelector<HTMLElement>(spec.word);
          return word ? letterRect(word, spec.index) : from.getBoundingClientRect();
        },
        overlay,
        next,
        onCovered: () => {
          window.scrollTo({ top: docTop(next), behavior: "instant" });
          getChapter(spec.to)?.play();
        },
        onPassed: () => getChapter(spec.to)?.rest(),
        onUncover: () => {
          window.scrollTo({ top: Math.max(0, docTop(next) - window.innerHeight), behavior: "instant" });
          const c = getChapter(spec.to);
          if (c && c.phase === "intro") c.rest();
        },
        onSettle: onScroll,
      }),
    );
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    window.removeEventListener("scroll", onScroll);
    if (raf) cancelAnimationFrame(raf);
    for (const c of cuts) c.destroy();
  };
}
