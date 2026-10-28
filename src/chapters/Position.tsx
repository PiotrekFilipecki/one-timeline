import { copy } from "@/lib/copy";
import { Code, Field, Foot, Line, Stage, Word } from "@/components/Poster";

/** POSITION: dyptyk SEQUENCE nad OVERLAP, ta sama skala. "+=0" vs "<0.06". */
export function Position() {
  const c = copy("position");
  return (
    <Field id="position" title={c.title}>
      <Stage>
        <Word name="sequence">{c.word}</Word>
        <Word as="p" name="overlap">{c.word2}</Word>
      </Stage>
      <Foot>
        <Line>{c.line}</Line>
        <Code lines={c.code} />
      </Foot>
    </Field>
  );
}
