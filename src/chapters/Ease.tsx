import { copy } from "@/lib/copy";
import { Field, Foot, Line, Stage, Word } from "@/components/Poster";

/** EASE: w spoczynku jedno słowo; P2 rozstawia 12 kopii według krzywej. */
export function Ease() {
  const c = copy("ease");
  return (
    <Field id="ease" title={c.title}>
      <Stage>
        <Word name="ease">{c.word}</Word>
      </Stage>
      <Foot>
        <Line>{c.line}</Line>
      </Foot>
    </Field>
  );
}
