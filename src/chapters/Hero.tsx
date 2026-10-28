import { copy } from "@/lib/copy";
import { Field, Foot, Line, Stage, Word } from "@/components/Poster";

/** Hero: zdanie, w którym każde słowo odgrywa swój rozdział (od P1). Indeksy górne = znaczniki czasu. */
export function Hero() {
  const c = copy("hero");
  const words = c.word.split(" ");
  const marks = c.marks ?? [];
  return (
    <Field id="hero" title={c.title}>
      <Stage>
        <Word as="h1" name="sentence">
          {words.map((w, i) => (
            <span key={i} data-word={w.replace(/[^a-z]/gi, "").toLowerCase()}>
              {w}
              {marks[i] && <sup data-mark>{marks[i]}</sup>}
              {i < words.length - 1 ? " " : null}
            </span>
          ))}
        </Word>
      </Stage>
      <Foot>
        <Line>{c.line}</Line>
      </Foot>
    </Field>
  );
}
