"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createSmoothScroll } from "@/motion/scroll";
import { createDecor } from "@/motion/decor";

/**
 * Powłoka strony: wrapper i treść ScrollSmoothera (treść jedzie transformem, więc wszystko, co ma być fixed,
 * stoi poza tym komponentem: koło cięcia, paski openera, ziarno) i dekoracje na scrollu. Efekt biegnie po
 * efektach dzieci, ale rozdziały tworzą ScrollTriggery dopiero po fontach, więc smoother jest pierwszy.
 */
export function PageScroll({ children }: { children: ReactNode }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!wrapper.current || !content.current) return;
    const stopSmooth = createSmoothScroll(wrapper.current, content.current);
    const stopDecor = createDecor();
    return () => {
      stopDecor();
      stopSmooth();
    };
  }, []);
  return (
    <div ref={wrapper} data-smooth-wrapper>
      <div ref={content} data-smooth-content>
        {children}
      </div>
    </div>
  );
}
