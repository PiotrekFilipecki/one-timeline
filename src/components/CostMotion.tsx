"use client";

import { useEffect, useRef } from "react";
import { createCost } from "@/motion/cost";

/** COST: orbita liter, przełącznik transform / left-top (aria-pressed), pauza (aria-pressed). */
export function CostMotion() {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = anchor.current?.closest<HTMLElement>("[data-chapter]");
    if (!root) return;
    const scene = createCost(root);
    const toggle = root.querySelector<HTMLButtonElement>("[data-cost-mode]");
    const pause = root.querySelector<HTMLButtonElement>("[data-cost-pause]");
    const onToggle = () => {
      const layout = toggle!.getAttribute("aria-pressed") !== "true";
      toggle!.setAttribute("aria-pressed", String(layout));
      scene.setMode(layout ? "layout" : "transform");
    };
    const onPause = () => {
      const paused = pause!.getAttribute("aria-pressed") !== "true";
      pause!.setAttribute("aria-pressed", String(paused));
      scene.setPaused(paused);
    };
    toggle?.addEventListener("click", onToggle);
    pause?.addEventListener("click", onPause);
    return () => {
      toggle?.removeEventListener("click", onToggle);
      pause?.removeEventListener("click", onPause);
      scene.destroy();
    };
  }, []);
  return <span ref={anchor} hidden data-motion-anchor="cost" />;
}
