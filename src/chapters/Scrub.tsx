import { copy } from "@/lib/copy";
import { Field, Foot, Line, Stage, Word } from "@/components/Poster";
import { Playhead } from "@/components/Playhead";
import { ScrubMotion } from "@/components/ScrubMotion";
import { Blob } from "@/components/Blob";

/** SCRUB: jedyny rozdział na scrollu (przypięty). Spoczynek = środek osi wdth/wght (CSS); JS rozciąga 50 → 150. */
export function Scrub() {
  const c = copy("scrub");
  return (
    <Field id="scrub" title={c.title}>
      <Stage>
        <Word name="scrub">{c.word}</Word>
        <Playhead label={c.playhead ?? "Playhead"} />
        {/* Jog wheel: obraca się z postępem scrolla. */}
        <Blob chapter="scrub" />
      </Stage>
      {/* Sekcja przypięta: parallax stopki stałby w miejscu i walczył z pinem. */}
      <Foot speed={1}>
        <Line>{c.line}</Line>
      </Foot>
      <ScrubMotion />
    </Field>
  );
}
