"use client";

import { useEffect, useRef } from "react";
import { createChapter, type ChapterController } from "@/motion/chapter";
import { heroIntro } from "@/motion/hero";
import { fontAxisHover } from "@/motion/hover";
import { CHAPTERS } from "@/lib/palette";

/**
 * Hero: kontroler rozdziału + Replay (tylko zdanie) + hover/focus szerokości na słowach.
 * Montowany wewnątrz Field hero; DOM spoczynku pochodzi z serwera, ten komponent go tylko odgrywa.
 */
export function HeroMotion() {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = anchor.current?.closest<HTMLElement>("[data-chapter]");
    if (!root) return;
    let revert: (() => void) | null = null;
    const chapter: ChapterController = createChapter({
      id: "hero",
      root,
      build: {
        intro: (ctx) => {
          const built = heroIntro(root, ctx);
          revert = built.revert;
          return built.timeline;
        },
        revert: () => {
          revert?.();
          revert = null;
        },
      },
    });

    const replay = root.querySelector<HTMLButtonElement>("[data-replay]");
    const onReplay = () => chapter.play();
    replay?.addEventListener("click", onReplay);

    // Słowa zdania: hover/focus = rozciągnięcie w pinned boxie; aktywacja = replay (zdanie).
    const hovers = Array.from(root.querySelectorAll<HTMLElement>("[data-word-key]")).map((box) => {
      const type = box.querySelector<HTMLElement>(".t")!;
      return fontAxisHover(box, type);
    });
    const onWord = () => chapter.play();
    for (const box of root.querySelectorAll<HTMLElement>("[data-word-key]")) {
      // Bez JS przycisk nic nie robi, więc serwer renderuje tabindex=-1; z JS wraca do kolejki Tab.
      box.tabIndex = 0;
      box.addEventListener("click", onWord);
    }

    return () => {
      replay?.removeEventListener("click", onReplay);
      for (const box of root.querySelectorAll<HTMLElement>("[data-word-key]")) box.removeEventListener("click", onWord);
      for (const h of hovers) h.destroy();
      chapter.destroy();
    };
  }, []);
  return <span ref={anchor} hidden data-motion-anchor="hero" />;
}

/** Osiem pasków openera w kolejności łańcucha. SSR; widoczne tylko pod bramką (CSS). */
export function OpenerBars() {
  return (
    <div data-opener-bars aria-hidden="true">
      {CHAPTERS.map((c) => (
        <span key={c.id} style={{ background: c.bg }} />
      ))}
    </div>
  );
}
