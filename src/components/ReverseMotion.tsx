"use client";

import { useEffect, useRef } from "react";
import { createChapter, type ChapterController } from "@/motion/chapter";
import { reverseIntro } from "@/motion/reverse";
import { attachPlayhead, chapterTarget } from "@/motion/playhead";

/** REVERSE: kontroler (gra po cięciu) i głowica, która wraca w lewo podczas cofania. */
export function ReverseMotion() {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = anchor.current?.closest<HTMLElement>("[data-chapter]");
    if (!root) return;
    let revert: (() => void) | null = null;
    const chapter: ChapterController = createChapter({
      id: "reverse",
      root,
      autoplay: false,
      build: {
        intro: () => {
          const built = reverseIntro(root);
          revert = built.revert;
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
  return <span ref={anchor} hidden data-motion-anchor="reverse" />;
}
