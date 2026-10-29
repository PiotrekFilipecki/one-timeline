// Cztery easingi rozdziału EASE. Wartości liczy gsap.parseEase (gsap-core, bez DOM), także na serwerze:
// GSAP ma własną, zmodyfikowaną krzywą expo (nie podręcznikowe 1 − 2^(−10t)), więc replika rozjeżdżała się
// o kilka pikseli. Jedyny import GSAP poza src/motion: tylko do liczb, zero animacji (wyjątek w CLAUDE.md).
import { gsap } from "gsap";

export const EASE_NAMES = ["none", "power2.inOut", "back.out(1.7)", "expo.out"] as const;
export type EaseName = (typeof EASE_NAMES)[number];

/** Układ spoczynku i koniec timeline'u EASE. */
export const EASE_REST: EaseName = "expo.out";

/** Liczba kopii słowa w onion skinie. */
export const EASE_COPIES = 12;

export const ease = (name: EaseName, t: number): number => gsap.parseEase(name)(t);

/** Pozycje 0..1 kopii i = 0..n-1 dla danego easingu. */
export const layout = (name: EaseName, n = EASE_COPIES): number[] => Array.from({ length: n }, (_, i) => ease(name, i / (n - 1)));
