"use client";

import { useEffect, useRef } from "react";
import { createCuts } from "@/motion/cuts";

/** Jedno koło cięcia dla całej strony (SSR, niewidoczne w spoczynku) i wszystkie cięcia z CUTS. */
export function Cuts() {
  const overlay = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!overlay.current) return;
    return createCuts(overlay.current);
  }, []);
  return <div ref={overlay} data-cut aria-hidden="true" />;
}
