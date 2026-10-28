// Jedno źródło koloru. MOTION.md: łańcuch, typografia rozdziału N = tło rozdziału N+1.
// Komponent rozdziału ustawia z tego zmienne CSS (--bg, --fg, --body) na [data-chapter];
// SCSS tylko je czyta. Test kontrastów liczy wzorem WCAG z tych samych danych.

export type ChapterId = "hero" | "position" | "ease" | "stagger" | "scrub" | "reverse" | "cost" | "yours";

export type Paint = {
  /** Pole. */
  bg: string;
  /** Typografia display (≥ 3.0:1 do bg). */
  fg: string;
  /** Tekst body (≥ 4.5:1 do bg). Brak = w tym stanie nie ma body. */
  body?: string;
};

export type Chapter = Paint & {
  id: ChapterId;
  /** Numer w łańcuchu, 0 = hero. */
  index: number;
  /** Nazwy farb, do devlogu i komunikatów testów. */
  names: { bg: string; fg: string };
};

const PINK = "#FF4FB4";
const PLUM = "#4A0D3A";
const ACID = "#C6FF1A";
const BLUE = "#2B1BFF";
const YELLOW = "#FFE500";
const VIOLET = "#6A1BFF";
const MINT = "#A8F5CF";
const GREEN = "#06402B";
const RED = "#FF3B12";

export const CHAPTERS: readonly Chapter[] = [
  { id: "hero", index: 0, bg: PINK, fg: PLUM, body: PLUM, names: { bg: "róż", fg: "śliwka" } },
  { id: "position", index: 1, bg: PLUM, fg: ACID, body: ACID, names: { bg: "śliwka", fg: "acid" } },
  { id: "ease", index: 2, bg: ACID, fg: BLUE, body: BLUE, names: { bg: "acid", fg: "niebieski" } },
  { id: "stagger", index: 3, bg: BLUE, fg: YELLOW, body: YELLOW, names: { bg: "niebieski", fg: "żółty" } },
  { id: "scrub", index: 4, bg: YELLOW, fg: VIOLET, body: VIOLET, names: { bg: "żółty", fg: "fiolet" } },
  { id: "reverse", index: 5, bg: VIOLET, fg: MINT, body: MINT, names: { bg: "fiolet", fg: "mięta" } },
  { id: "cost", index: 6, bg: MINT, fg: GREEN, body: GREEN, names: { bg: "mięta", fg: "zieleń" } },
  // Pętla do hero: typografia YOURS = tło hero. Róż na zieleni to 3.96, tylko display; body w mięcie.
  { id: "yours", index: 7, bg: GREEN, fg: PINK, body: MINT, names: { bg: "zieleń", fg: "róż" } },
];

/** COST po przekroczeniu budżetu klatki: pole tnie się na czerwień. Tylko display (3.31). */
export const JANK: Paint & { names: { bg: string; fg: string } } = {
  bg: RED,
  fg: GREEN,
  names: { bg: "czerwień", fg: "zieleń" },
};

export const chapter = (id: ChapterId): Chapter => {
  const found = CHAPTERS.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown chapter: ${id}`);
  return found;
};

/** Zmienne CSS dla [data-chapter]. Inline w HTML z serwera, więc kolory działają bez JS. */
export const paintVars = (p: Paint): Record<`--${string}`, string> => ({
  "--bg": p.bg,
  "--fg": p.fg,
  "--body": p.body ?? p.fg,
});
