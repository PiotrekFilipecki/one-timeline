"use client";

import { useEffect, useRef } from "react";
import { createYours } from "@/motion/yours";

/** YOURS: formularz linijki tl.to(), Play, Reverse, kopiowanie linijki. Walidacja po każdej zmianie pola. */
export function YoursMotion() {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = anchor.current?.closest<HTMLElement>("[data-chapter]");
    if (!root) return;
    const form = root.querySelector<HTMLFormElement>("[data-yours-form]");
    const line = root.querySelector<HTMLElement>("[data-yours-line]");
    const status = root.querySelector<HTMLElement>("[data-yours-status]");
    const fields = Array.from(root.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-field]"));

    const scene = createYours(root, (values, code) => {
      if (line) line.textContent = code;
      // Zmiana to moment zatwierdzenia (event change), więc pole dostaje wartość po walidacji, także gdy ma focus.
      for (const f of fields) {
        const key = f.dataset.field as keyof typeof values;
        f.value = String(values[key]);
      }
    });
    const read = () => Object.fromEntries(fields.map((f) => [f.dataset.field!, f.value]));
    const onInput = () => {
      const v = scene.set(read());
      const x = fields.find((f) => f.dataset.field === "x");
      if (x) {
        x.setAttribute("min", String(scene.minX()));
        x.setAttribute("max", String(scene.maxX()));
      }
      if (status) status.textContent = `x from ${scene.minX()} to ${scene.maxX()} px (the letters stay in the frame)`;
      return v;
    };
    const onSubmit = (e: Event) => {
      e.preventDefault();
      onInput();
      scene.play();
    };
    const onReverse = () => scene.reverse();
    const onCopy = async () => {
      if (!line) return;
      try {
        await navigator.clipboard.writeText(line.textContent ?? "");
        if (status) status.textContent = "Copied.";
        scene.flash();
      } catch {
        if (status) status.textContent = "Select the line to copy it.";
      }
    };
    for (const f of fields) f.addEventListener("change", onInput);
    form?.addEventListener("submit", onSubmit);
    const reverse = root.querySelector<HTMLButtonElement>("[data-yours-reverse]");
    const copy = root.querySelector<HTMLButtonElement>("[data-yours-copy]");
    reverse?.addEventListener("click", onReverse);
    copy?.addEventListener("click", onCopy);
    onInput();
    return () => {
      for (const f of fields) f.removeEventListener("change", onInput);
      form?.removeEventListener("submit", onSubmit);
      reverse?.removeEventListener("click", onReverse);
      copy?.removeEventListener("click", onCopy);
      scene.destroy();
    };
  }, []);
  return <span ref={anchor} hidden data-motion-anchor="yours" />;
}
