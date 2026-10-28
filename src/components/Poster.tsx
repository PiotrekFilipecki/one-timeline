import type { CSSProperties, ReactNode } from "react";
import { chapter, paintVars, type ChapterId } from "@/lib/palette";
import s from "./Poster.module.scss";

// Prymitywy plakatu. Każdy rozdział to Field z dokładnie dwiema farbami ustawionymi inline
// z palette.ts (działa bez JS). Nazwy mówią, co widać: Field, Index, Word, Line, Code.

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
      {children}
    </section>
  );
}

/** Scena rozdziału: miejsce na słowo lub dyptyk. Położenie per rozdział w Poster.module.scss. */
export function Stage({ children }: { children: ReactNode }) {
  return (
    <div className={s.stage} data-fonts-wait>
      {children}
    </div>
  );
}

/** Słowo rozdziału w stanie spoczynku. h2 dla pierwszego słowa, p dla drugiego w dyptyku. */
export function Word({ as: Tag = "h2", name, children }: { as?: "h1" | "h2" | "p"; name: string; children: ReactNode }) {
  return (
    <Tag className={s.word} data-word={name} data-split>
      {children}
    </Tag>
  );
}

/** Stopka plakatu: jedna linijka EN i linijki kodu. */
export function Foot({ children }: { children: ReactNode }) {
  return (
    <div className={s.foot} data-fonts-wait>
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
        <code key={i}>{l}</code>
      ))}
    </pre>
  );
}
