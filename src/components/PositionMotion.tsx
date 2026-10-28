"use client";

import { useEffect, useRef } from "react";
import { createChapter, type ChapterController } from "@/motion/chapter";
import { positionIntro, positionOutro } from "@/motion/position";
import { attachPlayhead } from "@/motion/playhead";
import { createCut } from "@/motion/cut";

/**
 * POSITION: kontroler (gra po cięciu z hero, nie sam z wejścia w kadr), głowica jako slider
 * i cięcie hero → POSITION przez kropkę zdania hero.
 */
export function PositionMotion() {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = anchor.current?.closest<HTMLElement>("[data-chapter]");
    if (!root) return;
    let revert: (() => void) | null = null;
    const chapter: ChapterController = createChapter({
      id: "position",
      root,
      autoplay: false,
      build: {
        intro: (ctx) => {
          const built = positionIntro(root, ctx);
          revert = built.revert;
          return built.timeline;
        },
        outro: () => positionOutro(root),
        revert: () => {
          revert?.();
          revert = null;
        },
      },
    });

    const playhead = root.querySelector<HTMLElement>("[data-playhead]");
    const track = root.querySelector<HTMLElement>("[data-stage]");
    const detach = playhead && track ? attachPlayhead({ el: playhead, track, chapter }) : null;

    // Cięcie: kropka hero rośnie do pełnego kadru śliwki, dokument skacze na POSITION, POSITION gra.
    const hero = document.querySelector<HTMLElement>('[data-chapter="hero"]');
    const overlay = document.querySelector<HTMLElement>("[data-cut]");
    const dot = hero?.querySelector<HTMLElement>("[data-dot]");
    const cut =
      hero && overlay && dot
        ? createCut({
            letter: () => dot,
            overlay,
            next: root,
            onCovered: () => {
              window.scrollTo({ top: root.offsetTop, behavior: "instant" });
              chapter.play();
            },
            onPassed: () => chapter.rest(),
            onUncover: () => {
              window.scrollTo({ top: Math.max(0, root.offsetTop - window.innerHeight), behavior: "instant" });
              if (chapter.phase === "intro") chapter.rest();
            },
          })
        : null;

    return () => {
      detach?.();
      cut?.destroy();
      chapter.destroy();
    };
  }, []);
  return <span ref={anchor} hidden data-motion-anchor="position" />;
}
