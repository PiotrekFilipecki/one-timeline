// Preferencja ruchu: media query + nadpisanie przez data-motion na <html> ("full" | "reduced").
// Nadpisanie jest aplikacyjne (np. przełącznik w P3), więc matchMedia go nie widzi: każdy
// builder czyta prefersReducedMotion() w chwili budowania, a kontroler przebudowuje na zmianę.

export type MotionChoice = "full" | "reduced";

const QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  const choice = document.documentElement.dataset.motion;
  if (choice === "reduced") return true;
  if (choice === "full") return false;
  return window.matchMedia(QUERY).matches;
}

/** Ustawia lub zdejmuje nadpisanie. Bez argumentu wraca do preferencji systemu. */
export function setMotionChoice(choice?: MotionChoice): void {
  const html = document.documentElement;
  if (choice) html.dataset.motion = choice;
  else delete html.dataset.motion;
  html.dispatchEvent(new CustomEvent("motionchange"));
}

/** Wywołuje cb przy zmianie preferencji systemowej albo nadpisania. Zwraca funkcję sprzątającą. */
export function watchReducedMotion(cb: (reduced: boolean) => void): () => void {
  const mq = window.matchMedia(QUERY);
  const fire = () => cb(prefersReducedMotion());
  mq.addEventListener("change", fire);
  document.documentElement.addEventListener("motionchange", fire);
  return () => {
    mq.removeEventListener("change", fire);
    document.documentElement.removeEventListener("motionchange", fire);
  };
}
