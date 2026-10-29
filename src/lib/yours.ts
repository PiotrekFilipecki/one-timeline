// YOURS: wartości linijki tl.to(), walidacja i format kodu. Czyste funkcje, używane na serwerze (stan
// spoczynku bez JS) i w kliencie. Nazwy krzywych to nazwy z MOTION.md (rejestrowane w src/motion/register.ts).

export const YOURS_EASES = ["beat", "beat-exit", "expo.out", "back.out(1.7)", "none"] as const;
export const YOURS_POSITIONS = ["+=0", "<", "<0.1", "-=0.3"] as const;

export type YoursValues = {
  x: number;
  rotation: number;
  duration: number;
  ease: (typeof YOURS_EASES)[number];
  position: (typeof YOURS_POSITIONS)[number];
};

export const YOURS_DEFAULT: YoursValues = { x: 120, rotation: 12, duration: 0.8, ease: "beat", position: "+=0" };

export const YOURS_LIMITS = { rotation: [-180, 180], duration: [0.1, 3] } as const;

/** Waliduje i ogranicza wartości. `maxX` / `minX` = ile liter może przesunąć się w prawo / w lewo, żeby zostać w kadrze. */
export function clampValues(raw: Partial<Record<keyof YoursValues, string | number>>, maxX: number, minX = -maxX): YoursValues {
  const num = (v: unknown, fallback: number, [lo, hi]: readonly [number, number]) => {
    const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
  };
  const ease = (YOURS_EASES as readonly string[]).includes(String(raw.ease)) ? (raw.ease as YoursValues["ease"]) : YOURS_DEFAULT.ease;
  const position = (YOURS_POSITIONS as readonly string[]).includes(String(raw.position)) ? (raw.position as YoursValues["position"]) : YOURS_DEFAULT.position;
  return {
    x: num(raw.x, Math.min(maxX, Math.max(minX, YOURS_DEFAULT.x)), [minX, maxX]),
    rotation: num(raw.rotation, YOURS_DEFAULT.rotation, YOURS_LIMITS.rotation),
    duration: num(raw.duration, YOURS_DEFAULT.duration, YOURS_LIMITS.duration),
    ease,
    position,
  };
}

export const codeLine = (v: YoursValues): string => `tl.to(".letter", { x: ${v.x}, rotation: ${v.rotation}, duration: ${v.duration}, ease: "${v.ease}" }, "${v.position}")`;
