"use client";

import { useEffect, useRef } from "react";
import { createChapter, type ChapterController } from "@/motion/chapter";
import { easeIntro, easeLayout } from "@/motion/ease";
import { attachPlayhead, chapterTarget } from "@/motion/playhead";
import { gsap } from "@/motion/register";
import type { EaseName } from "@/lib/eases";

/** EASE: kontroler (gra po cięciu), głowica, przyciski easingów (kopie przelatują między układami). */
export function EaseMotion() {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = anchor.current?.closest<HTMLElement>("[data-chapter]");
    if (!root) return;
    let revert: (() => void) | null = null;
    let layoutTween: gsap.core.Timeline | null = null;
    const chapter: ChapterController = createChapter({
      id: "ease",
      root,
      autoplay: false,
      build: {
        intro: (ctx) => {
          const built = easeIntro(root, ctx);
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

    const onButton = (e: Event) => {
      const name = (e.currentTarget as HTMLElement).dataset.ease as EaseName;
      // Jeden właściciel transformu: intro w spoczynek, potem osobny przelot do układu.
      chapter.rest();
      layoutTween?.kill();
      layoutTween = easeLayout(root, name);
    };
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-ease]"));
    for (const b of buttons) b.addEventListener("click", onButton);
    return () => {
      for (const b of buttons) b.removeEventListener("click", onButton);
      layoutTween?.kill();
      detach?.();
      chapter.destroy();
    };
  }, []);
  return <span ref={anchor} hidden data-motion-anchor="ease" />;
}
