import { copy } from "@/lib/copy";
import { Code, Field, Foot, Line, Stage, Word } from "@/components/Poster";

/** YOURS: edytowalna linijka tl.to() (P3). W spoczynku: linijka statyczna, słowo cięte dolną krawędzią. */
export function Yours() {
  const c = copy("yours");
  return (
    <Field id="yours" title={c.title}>
      <Stage>
        <Word name="yours">{c.word}</Word>
      </Stage>
      <Foot>
        <Line>{c.line}</Line>
        <Code lines={c.code} />
      </Foot>
    </Field>
  );
}
