import { copy } from "@/lib/copy";
import { Code, Field, Foot, Line, Stage, Word } from "@/components/Poster";
import s from "@/components/Poster.module.scss";

/** COST: transform vs left/top. W spoczynku liczba pokazuje budżet klatki; P3 podmienia na pomiar. */
export function Cost() {
  const c = copy("cost");
  return (
    <Field id="cost" title={c.title}>
      <Stage>
        <Word name="cost">{c.word}</Word>
        <p className={s.number} data-line="number">
          {c.number}
          <small>{c.unit}</small>
        </p>
      </Stage>
      <Foot>
        <Line>{c.line}</Line>
        <Code lines={c.code} />
      </Foot>
    </Field>
  );
}
