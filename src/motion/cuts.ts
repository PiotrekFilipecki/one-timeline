// Sygnatura strony między każdą parą rozdziałów: cięcie przez literę. Jedna konfiguracja, jedno koło
// (kolor następnego pola ustawiany set(), nigdy tweenowany). Litera tnąca per rozdział: ta, która
// prowadzi kompozycję (wybór i powód w devlogu P2). Litery mierzone przez Range na węzłach tekstowych,
// więc działa i na tekście w spoczynku, i w trakcie splitu.
"use client";

import { chapter, type ChapterId } from "@/lib/palette";
import { createCut, type Cut } from "./cut";
import { getChapter } from "./stage";
import { jumpTo, onScrollUpdate, scrollPositionOf } from "./scroll";

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
  { from: "cost", to: "yours", word: '[data-word="cost"]', index: 1 },
];

/** Pętla: ostatnie cięcie (S z YOURS) zalewa kadr różem i przewija na górę do hero w spoczynku. */
export const LOOP: CutSpec = { from: "yours", to: "hero", word: '[data-word="yours"]', index: -1 };

/** Koniec dokumentu (z marginesem 2 px na zaokrąglenia). Pasek, nie wygładzona treść: cel scrolla. */
export const atDocumentEnd = (): boolean => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

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

/** Pozycja elementu w dokumencie. offsetTop zawodzi wewnątrz pin-spacera ScrollTriggera (position: relative);
 *  przy smootherze rect + wygładzony scroll (scroll.ts). */
export const docTop = (el: HTMLElement): number => scrollPositionOf(el);

const section = (id: ChapterId): HTMLElement | null => document.querySelector<HTMLElement>(`[data-chapter="${id}"]`);

/** Litera tnąca ze specyfikacji, mierzona w chwili cięcia; bez słowa: box całej sekcji. */
const cutLetter = (from: HTMLElement, spec: CutSpec) => (): DOMRect => {
  const word = from.querySelector<HTMLElement>(spec.word);
  return word ? letterRect(word, spec.index) : from.getBoundingClientRect();
};

type Coordinator = {
  /** Sprawdza progi w następnej klatce (nasłuch scrolla, osiadanie po cięciu). */
  schedule: () => void;
  destroy: () => void;
};

/**
 * Jeden nasłuch scrolla dla wszystkich cięć. Przy przejściu przez kilka progów naraz (skok, szybki scroll)
 * w dół gra tylko najdalsze cięcie, wcześniejsze przechodzą cicho; w górę gra tylko najbliższe hero,
 * dalsze wracają cicho. Dzięki temu dwa cięcia nigdy nie walczą o jedno koło ani o pozycję dokumentu.
 */
function createCoordinator(cuts: readonly Cut[]): Coordinator {
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
  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      check();
    });
  };
  window.addEventListener("scroll", schedule, { passive: true });
  // Smoother: treść dojeżdża jeszcze po ostatnim zdarzeniu scroll, więc progi sprawdzamy też z jego onUpdate.
  const offSmooth = onScrollUpdate(schedule);
  return {
    schedule,
    destroy: () => {
      window.removeEventListener("scroll", schedule);
      offSmooth();
      if (raf) cancelAnimationFrame(raf);
    },
  };
}

/** Cięcie między dwoma rozdziałami: skok dokumentu pod zakryciem i start następnego rozdziału. */
function createChapterCut(spec: CutSpec, overlay: HTMLElement, onSettle: () => void): Cut | null {
  const from = section(spec.from);
  const next = section(spec.to);
  if (!from || !next) return null;
  return createCut({
    id: spec.to,
    color: chapter(spec.to).bg,
    rect: cutLetter(from, spec),
    overlay,
    next,
    onCovered: () => {
      jumpTo(docTop(next));
      getChapter(spec.to)?.play();
    },
    onPassed: () => getChapter(spec.to)?.rest(),
    onUncover: () => {
      jumpTo(docTop(next) - window.innerHeight);
      const c = getChapter(spec.to);
      if (c && c.phase === "intro") c.rest();
    },
    onSettle,
  });
}

/** Pętla do hero: próg = koniec dokumentu; po cięciu wraca do stanu „przed", żeby zagrać znowu.
 *  Link „Back to the top" (`[data-top]`) gra ją z klawiatury; bez JS zostaje kotwicą. */
function createLoop(overlay: HTMLElement, onSettle: () => void, onLooped: () => void): { cut: Cut; destroy: () => void } | null {
  const from = section(LOOP.from);
  const hero = section(LOOP.to);
  if (!from || !hero) return null;
  const cut = createCut({
    id: "loop",
    color: chapter(LOOP.to).bg,
    rect: cutLetter(from, LOOP),
    overlay,
    next: hero,
    // Koniec dokumentu, ale nie wtedy, gdy fokus jest w stopce: Tab do ostatnich linków dojeżdża do końca
    // strony (smoother centruje element z fokusem) i pętla wyrzucałaby klawiaturowego użytkownika na górę.
    // Z klawiatury pętlę gra link „Back to the top".
    forwardWhen: () => atDocumentEnd() && !document.activeElement?.closest("[data-sources]"),
    backWhen: () => true,
    resetAfterForward: true,
    onCovered: () => {
      jumpTo(0);
      // Hero w spoczynku: bez ponownego openera i bez replayu zdania. Cięcia rozdziałów wracają cicho do
      // „przed": inaczej koordynator zagrałby cięcie POSITION wstecz (śliwkowe koło nad hero) zaraz po pętli.
      getChapter(LOOP.to)?.rest();
      onLooped();
    },
    onUncover: () => {},
    onSettle,
  });
  const topLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-top]"));
  const onTop = (e: Event) => {
    e.preventDefault();
    // Fokus schodzi z linku: warunek pętli wyklucza fokus w stopce, a po skoku na górę kolejka Tab zaczyna się od hero.
    (e.currentTarget as HTMLElement).blur();
    cut.forward();
  };
  for (const a of topLinks) a.addEventListener("click", onTop);
  return {
    cut,
    destroy: () => {
      for (const a of topLinks) a.removeEventListener("click", onTop);
    },
  };
}

/** Wszystkie cięcia strony na jednym kole, pod jednym koordynatorem. Zwraca sprzątanie. */
export function createCuts(overlay: HTMLElement): () => void {
  const cuts: Cut[] = [];
  const coordinator = createCoordinator(cuts);
  for (const spec of CUTS) {
    const cut = createChapterCut(spec, overlay, coordinator.schedule);
    if (cut) cuts.push(cut);
  }
  const loop = createLoop(overlay, coordinator.schedule, () => {
    for (const c of cuts) c.unpass();
  });
  if (loop) cuts.push(loop.cut);
  return () => {
    coordinator.destroy();
    loop?.destroy();
    for (const c of cuts) c.destroy();
  };
}
