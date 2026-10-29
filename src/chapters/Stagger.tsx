import { copy } from "@/lib/copy";
import { Field, Foot, Line, Stage } from "@/components/Poster";
import { Playhead } from "@/components/Playhead";
import { StaggerMotion } from "@/components/StaggerMotion";
import { Blob, Dominoes } from "@/components/Blob";
import s from "@/components/Poster.module.scss";

export const STAGGER_COLS = 16;
export const STAGGER_ROWS = 7;

/**
 * STAGGER: słowo z siatki liter 16×7 (telefon 8×7 przez CSS). Każda komórka to jedna litera słowa,
 * powtarzanego; nagłówek czyta się jako jedno słowo (aria-label), komórki są dekoracją.
 */
export function Stagger() {
  const c = copy("stagger");
  const cells = Array.from({ length: STAGGER_COLS * STAGGER_ROWS }, (_, i) => c.word[i % c.word.length]);
  return (
    <Field id="stagger" title={c.title}>
      <Stage>
        <h2 className={s.gridWord} data-word="stagger" aria-label={c.word}>
          <span className={s.grid} data-grid aria-hidden="true">
            {cells.map((letter, i) => (
              <span key={i} className={s.cell} data-cell>
                {letter}
              </span>
            ))}
          </span>
        </h2>
        <Playhead label={c.playhead ?? "Playhead"} />
        {/* Domino: blob przewraca się pierwszy, cztery duchy za nim ze staggerem. */}
        <Blob chapter="stagger" />
        <Dominoes />
      </Stage>
      <Foot>
        <Line>{c.line}</Line>
      </Foot>
      <StaggerMotion />
    </Field>
  );
}
