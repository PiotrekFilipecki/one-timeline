import type { CSSProperties, ReactNode } from "react";
import { chapter, paintVars, type ChapterId } from "@/lib/palette";
import s from "./Poster.module.scss";

// Prymitywy plakatu. Każdy rozdział to Field z dokładnie dwiema farbami ustawionymi inline
// z palette.ts (działa bez JS). Nazwy mówią, co widać: Field, Index, Numeral, Word, Line, Code.
// v7.1: etykieta obrócona wzdłuż lewej krawędzi, numer rozdziału w konturze za sceną (jedzie na scrollu),
// stopka jako bilet z lekkim parallaxem (data-speed czyta ScrollSmoother; SCRUB jest przypięty, bez).

export function Field({ id, title, children }: { id: ChapterId; title: string; children: ReactNode }) {
  const c = chapter(id);
  return (
    <section
      className={s.field}
      data-chapter={id}
      aria-label={title}
      style={paintVars(c) as CSSProperties}
    >
      <p className={s.index} data-line="index" data-fonts-wait>
        {c.index === 0 ? title : `0${c.index} ${title}`}
      </p>
      {/* Numer w konturze: hero dostaje `tl` (zmienna, w której żyje cała strona). Dekoracja, poza drzewem a11y. */}
      <span className={s.numeral} data-numeral data-fonts-wait aria-hidden="true">
        {c.index === 0 ? "tl" : String(c.index).padStart(2, "0")}
      </span>
      {children}
    </section>
  );
}

/** Scena rozdziału: miejsce na słowo lub dyptyk. Położenie per rozdział w Poster.module.scss. */
export function Stage({ children }: { children: ReactNode }) {
  return (
    <div className={s.stage} data-stage data-fonts-wait>
      {children}
    </div>
  );
}

/** Słowo rozdziału w stanie spoczynku. h2 dla pierwszego słowa, p dla drugiego w dyptyku. */
export function Word({ as: Tag = "h2", name, style, children }: { as?: "h1" | "h2" | "p"; name: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <Tag className={s.word} data-word={name} data-split style={style}>
      {children}
    </Tag>
  );
}

/** Stopka plakatu: jedna linijka EN i linijki kodu. `speed` = parallax ScrollSmoothera (1 = bez). */
export function Foot({ children, speed = 1.06 }: { children: ReactNode; speed?: number }) {
  return (
    <div className={s.foot} data-fonts-wait data-speed={speed === 1 ? undefined : speed}>
      {children}
    </div>
  );
}

export function Line({ children }: { children: string }) {
  return (
    <p className={s.line} data-line="line">
      {children}
    </p>
  );
}

export function Code({ lines }: { lines: string[] }) {
  if (!lines.length) return null;
  return (
    <pre className={s.code} data-line="code">
      {lines.map((l, i) => (
        // Każda linijka w swojej masce: wejście z dołu, wyjście w górę (nigdy fade-up).
        <span key={i} className={s.mask}>
          <code>{l}</code>
        </span>
      ))}
    </pre>
  );
}
