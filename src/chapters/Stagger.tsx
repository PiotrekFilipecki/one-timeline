import { copy } from "@/lib/copy";
import { Field, Foot, Line, Stage, Word } from "@/components/Poster";

/** STAGGER: oversized, cięte prawą krawędzią. P2 buduje je z siatki liter. */
export function Stagger() {
  const c = copy("stagger");
  return (
    <Field id="stagger" title={c.title}>
      <Stage>
        <Word name="stagger">{c.word}</Word>
      </Stage>
      <Foot>
        <Line>{c.line}</Line>
      </Foot>
    </Field>
  );
}
