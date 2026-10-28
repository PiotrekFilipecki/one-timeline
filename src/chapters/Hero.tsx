import { copy } from "@/lib/copy";
import { chapter } from "@/lib/palette";
import { Field, Foot, Line, Stage, Word } from "@/components/Poster";
import { HeroMotion, OpenerBars } from "@/components/HeroMotion";
import s from "@/components/Poster.module.scss";

/**
 * Hero: zdanie, w którym każde słowo odgrywa swój rozdział (HeroMotion). Indeksy górne = znaczniki czasu,
 * w HTML z serwera z COPY.md (bez JS), nadpisywane z labeli timeline'u po stronie klienta.
 * Kropka na końcu zdania jest osobnym elementem: z niej rośnie cięcie do POSITION.
 */
export function Hero() {
  const c = copy("hero");
  const words = c.word.replace(/\.$/, "").split(" ");
  const marks = c.marks ?? [];
  const next = chapter("position");
  return (
    <Field id="hero" title={c.title}>
      <OpenerBars />
      <Stage>
        <Word as="h1" name="sentence">
          {words.map((w, i) => {
            const key = w.replace(/[^a-z]/gi, "").toLowerCase();
            return (
              <span key={key} className={s.w} data-word={key}>
                <button type="button" className={s.wordButton} data-word-key={key} tabIndex={-1} aria-label={`Replay: ${key}`}>
                  <span className="t" data-split>
                    {w}
                  </span>
                </button>
                {i === words.length - 1 ? (
                  <span className="t" data-dot aria-hidden="true">
                    .
                  </span>
                ) : null}
                {marks[i] && <sup data-mark>{marks[i]}</sup>}
                {i < words.length - 1 ? " " : null}
              </span>
            );
          })}
        </Word>
      </Stage>
      <Foot>
        <Line>{c.line}</Line>
        <button type="button" className={s.replay} data-replay data-needs-js>
          {c.replay ?? "Replay"}
        </button>
      </Foot>
      {/* Koło cięcia: kolor następnego pola, fixed, niewidoczne w spoczynku. */}
      <div data-cut aria-hidden="true" style={{ background: next.bg }} />
      <HeroMotion />
    </Field>
  );
}
