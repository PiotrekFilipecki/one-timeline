import { copy } from "@/lib/copy";
import { Code, Field, Foot, Line, Stage, Word } from "@/components/Poster";
import { Playhead } from "@/components/Playhead";
import { PositionMotion } from "@/components/PositionMotion";
import { Blob } from "@/components/Blob";

/** POSITION: dyptyk SEQUENCE nad OVERLAP, ta sama skala, jedna głowica przez oba. "+=0" vs "<0.06". */
export function Position() {
  const c = copy("position");
  return (
    <Field id="position" title={c.title}>
      <Stage>
        <Word name="sequence">{c.word}</Word>
        <Word as="p" name="overlap">{c.word2}</Word>
        <Playhead label={c.playhead ?? "Playhead"} />
        {/* Bilet, który wchodzi bez kolejki ("<0.06"): łukiem z prawej na lewo w trakcie intro. */}
        <Blob chapter="position" />
      </Stage>
      <Foot>
        <Line>{c.line}</Line>
        <Code lines={c.code} />
      </Foot>
      <PositionMotion />
    </Field>
  );
}
