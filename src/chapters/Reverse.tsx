import { copy } from "@/lib/copy";
import { Code, Field, Foot, Line, Stage, Word } from "@/components/Poster";
import { Playhead } from "@/components/Playhead";
import { ReverseMotion } from "@/components/ReverseMotion";

/** REVERSE: dyptyk dwóch wierszy tej samej frazy: reverse() (góra) vs easeReverse: true (dół). */
export function Reverse() {
  const c = copy("reverse");
  return (
    <Field id="reverse" title={c.title}>
      <Stage>
        <Word name="reverse-plain">{c.word}</Word>
        <Word as="p" name="reverse-eased">{c.word2}</Word>
        <Playhead label={c.playhead ?? "Playhead"} />
      </Stage>
      <Foot>
        <Line>{c.line}</Line>
        <Code lines={c.code} />
      </Foot>
      <ReverseMotion />
    </Field>
  );
}
