// Rejestr kontrolerów rozdziałów po id, żeby cięcia mogły wołać play()/rest() następnego rozdziału
// bez sprzęgania komponentów. Jeden kontroler na id; unmount wyrejestrowuje.
"use client";

import type { ChapterController } from "./chapter";

const chapters = new Map<string, ChapterController>();

export function registerChapter(id: string, controller: ChapterController): () => void {
  chapters.set(id, controller);
  return () => {
    if (chapters.get(id) === controller) chapters.delete(id);
  };
}

export const getChapter = (id: string): ChapterController | undefined => chapters.get(id);
