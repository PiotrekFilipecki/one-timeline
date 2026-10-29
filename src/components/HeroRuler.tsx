import { parseMark } from "@/lib/blob";
import s from "./Poster.module.scss";

/** Zapas po ostatnim znaczniku: koniec zdania ≈ ostatni znacznik + 0.9 s. */
const TAIL = 0.9;

/**
 * Hero: linijka master timeline'u pod zdaniem. Kreska rysuje się w czasie rzeczywistym zdania (DrawSVG, ease none),
 * ticki wyrastają z linii w chwili swojego znacznika, znacznik głowicy jedzie od 0 do końca. SSR: wszystko narysowane.
 */
export function HeroRuler({ marks }: { marks: string[] }) {
  const total = (parseMark(marks[marks.length - 1] ?? "0:00.00") || 0) + TAIL;
  return (
    <svg className={s.ruler} data-ruler data-ruler-total={total.toFixed(2)} viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <line data-ruler-line x1="0" y1="32" x2="1000" y2="32" stroke="var(--fg)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      {marks.map((m, i) => {
        const x = ((parseMark(m) / total) * 1000).toFixed(1);
        return <line key={i} data-ruler-tick data-ruler-at={parseMark(m).toFixed(2)} x1={x} y1="32" x2={x} y2="8" stroke="var(--fg)" strokeWidth="3" vectorEffect="non-scaling-stroke" />;
      })}
      <rect data-ruler-head x="-6" y="0" width="12" height="40" fill="var(--fg)" transform="translate(1000 0)" />
    </svg>
  );
}
