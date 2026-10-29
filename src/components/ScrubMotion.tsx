"use client";

import { useEffect, useRef } from "react";
import { createScrub } from "@/motion/scrub";
import { attachPlayhead } from "@/motion/playhead";

/** SCRUB: scena przypięta do scrolla; głowica pokazuje i ustawia pozycję scrolla. */
export function ScrubMotion() {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = anchor.current?.closest<HTMLElement>("[data-chapter]");
    if (!root) return;
    const scene = createScrub(root);
    const playhead = root.querySelector<HTMLElement>("[data-playhead]");
    const track = root.querySelector<HTMLElement>("[data-stage]");
    const detach =
      playhead && track
        ? attachPlayhead({
            el: playhead,
            track,
            target: { seek: scene.seek, release: () => {}, duration: () => 0, held: () => false, progress: scene.progress },
          })
        : null;
    return () => {
      detach?.();
      scene.destroy();
    };
  }, []);
  return <span ref={anchor} hidden data-motion-anchor="scrub" />;
}
