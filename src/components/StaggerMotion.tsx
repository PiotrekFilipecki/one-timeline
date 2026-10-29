"use client";

import { useEffect, useRef } from "react";
import { createChapter, type ChapterController } from "@/motion/chapter";
import { staggerIntro } from "@/motion/stagger";
import { attachPlayhead, chapterTarget } from "@/motion/playhead";

/** STAGGER: kontroler (gra po cięciu) i głowica. */
export function StaggerMotion() {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = anchor.current?.closest<HTMLElement>("[data-chapter]");
    if (!root) return;
    let revert: (() => void) | null = null;
    const chapter: ChapterController = createChapter({
      id: "stagger",
      root,
      autoplay: false,
      build: {
        intro: () => {
          const built = staggerIntro(root);
          revert = built.revert;
          root.dataset.gridSize = `${built.grid.cols}x${built.grid.rows}`;
          return built.timeline;
        },
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
  return <span ref={anchor} hidden data-motion-anchor="stagger" />;
}
