import { copy } from "@/lib/copy";
import { Field, Foot, Line, Stage, Word } from "@/components/Poster";

/** SCRUB: jedyny rozdział na scrollu (P2). Spoczynek = środek osi wdth/wght. */
export function Scrub() {
  const c = copy("scrub");
  return (
    <Field id="scrub" title={c.title}>
      <Stage>
        <Word name="scrub">{c.word}</Word>
      </Stage>
      <Foot>
        <Line>{c.line}</Line>
      </Foot>
    </Field>
  );
}
