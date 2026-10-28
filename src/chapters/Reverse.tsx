import { copy } from "@/lib/copy";
import { Code, Field, Foot, Line, Stage, Word } from "@/components/Poster";

/** REVERSE: dyptyk dwóch wierszy tej samej frazy: reverse() vs easeReverse: true (P2). */
export function Reverse() {
  const c = copy("reverse");
  return (
    <Field id="reverse" title={c.title}>
      <Stage>
        <Word name="reverse-plain">{c.word}</Word>
        <Word as="p" name="reverse-eased">{c.word2}</Word>
      </Stage>
      <Foot>
        <Line>{c.line}</Line>
        <Code lines={c.code} />
      </Foot>
    </Field>
  );
}
