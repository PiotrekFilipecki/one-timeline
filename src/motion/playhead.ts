// Głowica: hairline w kolorze typografii. Przeciągalna (pointer, także dotyk) i sterowana klawiaturą
// (role="slider", strzałki, Home/End, aria-valuetext z czasem). Ustawia progress timeline'u rozdziału;
// po puszczeniu (pointerup, blur) rozdział wraca do spoczynku. Builder nie decyduje, kiedy gra: woła
// kontroler.
"use client";

import type { ChapterController } from "./chapter";
import { formatTime } from "./format";

export type PlayheadOptions = {
  /** Element slidera (hairline + pole chwytu). */
  el: HTMLElement;
  /** Obszar, po którym przelicza się x → progress. */
  track: HTMLElement;
  chapter: ChapterController;
  /** Krok strzałki w %. */
  step?: number;
};

export function attachPlayhead({ el, track, chapter, step = 2 }: PlayheadOptions): () => void {
  let value = 100;
  let dragging = false;

  const announce = () => {
    const d = chapter.duration();
    el.setAttribute("aria-valuenow", String(Math.round(value)));
    el.setAttribute("aria-valuetext", d ? `${formatTime((value / 100) * d)} of ${formatTime(d)}` : `${Math.round(value)}%`);
  };
  const set = (v: number) => {
    value = Math.min(100, Math.max(0, v));
    chapter.seek(value / 100);
    announce();
  };
  const release = () => {
    chapter.rest();
    value = 100;
    announce();
  };

  const fromPointer = (e: PointerEvent) => {
    const r = track.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * 100;
  };
  const down = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    dragging = true;
    el.setPointerCapture(e.pointerId);
    el.dataset.dragging = "";
    set(fromPointer(e));
    e.preventDefault();
  };
  const move = (e: PointerEvent) => {
    if (dragging) set(fromPointer(e));
  };
  const up = () => {
    if (!dragging) return;
    dragging = false;
    delete el.dataset.dragging;
    release();
  };
  const key = (e: KeyboardEvent) => {
    const map: Record<string, number | "home" | "end"> = {
      ArrowRight: step,
      ArrowUp: step,
      ArrowLeft: -step,
      ArrowDown: -step,
      PageUp: step * 5,
      PageDown: -step * 5,
      Home: "home",
      End: "end",
    };
    const k = map[e.key];
    if (k === undefined) return;
    e.preventDefault();
    if (k === "home") set(0);
    else if (k === "end") set(100);
    else set((chapter.phase === "intro" ? value : 100) + k);
  };
  const blur = () => {
    if (chapter.phase === "intro") release();
  };

  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
  el.addEventListener("lostpointercapture", up);
  el.addEventListener("keydown", key);
  el.addEventListener("blur", blur);
  announce();
  return () => {
    el.removeEventListener("pointerdown", down);
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", up);
    el.removeEventListener("lostpointercapture", up);
    el.removeEventListener("keydown", key);
    el.removeEventListener("blur", blur);
  };
}
