"use client";

import { useEffect, useRef } from "react";
import { createChapter, type ChapterController } from "@/motion/chapter";
import { positionIntro, positionOutro } from "@/motion/position";
import { attachPlayhead, chapterTarget } from "@/motion/playhead";

/** POSITION: kontroler (gra po cięciu z hero, nie sam z wejścia w kadr) i głowica jako slider. */
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
    const detach = playhead && track ? attachPlayhead({ el: playhead, track, target: chapterTarget(chapter) }) : null;
    return () => {
      detach?.();
      chapter.destroy();
    };
  }, []);
  return <span ref={anchor} hidden data-motion-anchor="position" />;
}
