// STAGGER: słowo z siatki liter (desktop 16×7, telefon 8×7: CSS chowa resztę). Trzy przejścia głowicy:
// from "center", "edges", "random"; jeden tween ze staggerem grid na każde. Między przejściami siatka
// znika cięciem (scaleY 0) i odrasta od podstawy. Spoczynek = pełne słowo (CSS).
"use client";

import { BEAT, gsap } from "./register";
import { blobMorph, blobParts, blobRevert } from "./blob";
import { footIntro } from "./foot";

export const STAGGER_PASS = 1.6;
export const STAGGER_FROMS = ["center", "edges", "random"] as const;

function parts(root: HTMLElement) {
  const grid = root.querySelector<HTMLElement>("[data-grid]")!;
  const all = Array.from(grid.querySelectorAll<HTMLElement>("[data-cell]"));
  const cells = all.filter((c) => getComputedStyle(c).display !== "none");
  const cols = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
  const rows = Math.ceil(cells.length / cols);
  return {
    grid,
    cells,
    cols,
    rows,
    stage: root.querySelector<HTMLElement>("[data-stage]")!,
    playhead: root.querySelector<HTMLElement>("[data-playhead]"),
    blob: blobParts(root),
    dominoes: Array.from(root.querySelectorAll<SVGPathElement>("[data-domino]")),
  };
}

export type StaggerIntro = { timeline: gsap.core.Timeline; revert: () => void; grid: { cols: number; rows: number; cells: number } };

export function staggerIntro(root: HTMLElement, { first = true }: { first?: boolean } = {}): StaggerIntro {
  const p = parts(root);
  const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
  const touched = [...p.cells, ...(p.playhead ? [p.playhead] : [])];
  let foot: (() => void) | null = null;
  const revert = () => {
    gsap.set(touched, { clearProps: "transform,transformOrigin,willChange" });
    foot?.();
    foot = null;
    if (p.blob) blobRevert(p.blob);
    // Duchy mają atrybut transform (translate): rotation 0 zamiast clearProps, żeby nie zjechały na x = 0.
    if (p.dominoes.length) gsap.set(p.dominoes, { rotation: 0 });
  };
  try {
    // Domino: blob morfuje w kostkę; w każdym przejściu przewraca się pierwszy, duchy za nim ze staggerem,
    // potem wszystkie wstają na back.out przed następnym przejściem.
    if (p.blob) blobMorph(tl, p.blob, 0);
    const tip = { rotation: 82, transformOrigin: "100% 100%", duration: 0.5, ease: "power2.in" };
    const travel = p.stage.getBoundingClientRect().width;
    STAGGER_FROMS.forEach((from, i) => {
      const at = i * STAGGER_PASS;
      tl.addLabel(from, at);
      tl.set(p.cells, { scaleY: 0, transformOrigin: "50% 100%" }, at);
      tl.to(p.cells, { scaleY: 1, duration: 0.45, ease: BEAT, stagger: { grid: [p.rows, p.cols], from, amount: 0.9 } }, at + 0.05);
      if (p.playhead) tl.fromTo(p.playhead, { x: -travel }, { x: 0, duration: STAGGER_PASS - 0.2, ease: "none" }, at);
      if (p.blob) {
        tl.to(p.blob.svg, tip, at + 0.3);
        if (p.dominoes.length) tl.to(p.dominoes, { ...tip, stagger: 0.09 }, at + 0.5);
        tl.to([p.blob.svg, ...p.dominoes], { rotation: 0, duration: 0.4, ease: "back.out(1.4)", stagger: 0.04 }, at + STAGGER_PASS - 0.35);
      }
    });
    tl.addLabel("end", STAGGER_FROMS.length * STAGGER_PASS - 0.2);
    foot = footIntro(tl, root, 0.4, { first }).revert;
  } catch (error) {
    tl.kill();
    revert();
    throw error;
  }
  return { timeline: tl, revert, grid: { cols: p.cols, rows: p.rows, cells: p.cells.length } };
}
