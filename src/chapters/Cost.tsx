import { copy } from "@/lib/copy";
import { Code, Field, Foot, Line, Stage, Word } from "@/components/Poster";
import { CostMotion } from "@/components/CostMotion";
import { Blob } from "@/components/Blob";
import s from "@/components/Poster.module.scss";

/**
 * COST: transform vs left/top z odczytem layoutu. Liczba ms na klatkę; po przekroczeniu budżetu pole tnie
 * się na czerwień (JS ustawia --bg). Bez JS: słowo, budżet klatki i jedno zdanie wyjaśnienia.
 */
export function Cost() {
  const c = copy("cost");
  return (
    <Field id="cost" title={c.title}>
      <Stage>
        <Word name="cost">{c.word}</Word>
        <p className={s.number} data-line="number">
          <span data-ms>{c.number}</span>
          <small>{c.unit}</small>
        </p>
        {/* Blob kręci patternem w rytm kosztu klatki; po budżecie morfuje w płomień. */}
        <Blob chapter="cost" />
      </Stage>
      <Foot>
        <div>
          <Line>{c.line}</Line>
          <p className={s.line} data-no-js>
            {c.nojs}
          </p>
          <div className={s.controls} data-needs-js>
            <button type="button" className={s.easeButton} data-cost-mode aria-pressed="false">
              {c.toggle ?? "left / top"}
            </button>
            <button type="button" className={s.easeButton} data-cost-pause aria-pressed="false">
              {c.pause ?? "Pause"}
            </button>
          </div>
        </div>
        <Code lines={c.code} />
      </Foot>
      <CostMotion />
    </Field>
  );
}
