import type { CSSProperties } from "react";
import { copy } from "@/lib/copy";
import { EASE_COPIES, EASE_NAMES, EASE_REST, layout } from "@/lib/eases";
import { Field, Foot, Line, Stage, Word } from "@/components/Poster";
import { Playhead } from "@/components/Playhead";
import { EaseMotion } from "@/components/EaseMotion";
import s from "@/components/Poster.module.scss";

/**
 * EASE: onion skin. 12 kopii słowa rozstawionych według easingu; w spoczynku expo.out, policzone na serwerze
 * (--p), więc gęstość kopii jest krzywą także bez JS. Aktor (h2) to ostatnia kopia, lądowanie krzywej;
 * duchy przed nim są konturem (text-stroke w --fg: dalej dwie farby).
 */
export function Ease() {
  const c = copy("ease");
  const rest = layout(EASE_REST, EASE_COPIES);
  return (
    <Field id="ease" title={c.title}>
      <Stage>
        <div className={s.onion} data-onion>
          {rest.slice(0, -1).map((p, i) => (
            <span key={i} className={`${s.word} ${s.ghost}`} data-copy aria-hidden="true" style={{ "--p": p } as CSSProperties}>
              {c.word}
            </span>
          ))}
          <Word name="ease" style={{ "--p": rest[rest.length - 1] } as CSSProperties}>
            {c.word}
          </Word>
        </div>
        <Playhead label={c.playhead ?? "Playhead"} />
      </Stage>
      <Foot>
        <Line>{c.line}</Line>
        <div className={s.eases} role="group" aria-label="Ease" data-needs-js>
          {EASE_NAMES.map((name) => (
            <button key={name} type="button" className={s.easeButton} data-ease={name} aria-pressed={name === EASE_REST}>
              {name}
            </button>
          ))}
        </div>
      </Foot>
      <EaseMotion />
    </Field>
  );
}
