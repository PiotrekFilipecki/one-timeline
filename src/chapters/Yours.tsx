import { readFileSync } from "node:fs";
import { join } from "node:path";
import { copy } from "@/lib/copy";
import { chapter, paintVars } from "@/lib/palette";
import { Field, Foot, Line, Stage, Word } from "@/components/Poster";
import { YoursMotion } from "@/components/YoursMotion";
import { YOURS_DEFAULT, YOURS_EASES, YOURS_POSITIONS, codeLine } from "@/lib/yours";
import s from "@/components/Poster.module.scss";
import type { CSSProperties } from "react";

/** YOURS: edytowalna linijka tl.to() + Play / Reverse na literach słowa. Bez JS: linijka statyczna i zdanie. */
export function Yours() {
  const c = copy("yours");
  const v = YOURS_DEFAULT;
  return (
    <Field id="yours" title={c.title}>
      <Stage>
        <Word name="yours">{c.word}</Word>
      </Stage>
      <Foot>
        <div>
          <Line>{c.line}</Line>
          <p className={s.line} data-no-js>
            {c.nojs}
          </p>
        </div>
        <div className={s.yours}>
          <pre className={s.code} data-line="code">
            <code data-yours-line>{codeLine(v)}</code>
          </pre>
          {/* noValidate: walidacja i ograniczenia są w src/lib/yours.ts; natywny step blokowałby submit (np. x = 259 przy step 10). */}
          <form className={s.form} data-yours-form data-needs-js noValidate>
            <label>
              <span>x</span>
              <input type="number" name="x" data-field="x" defaultValue={v.x} step="any" inputMode="numeric" />
            </label>
            <label>
              <span>rotation</span>
              <input type="number" name="rotation" data-field="rotation" defaultValue={v.rotation} min={-180} max={180} step={1} inputMode="numeric" />
            </label>
            <label>
              <span>duration</span>
              <input type="number" name="duration" data-field="duration" defaultValue={v.duration} min={0.1} max={3} step="any" inputMode="decimal" />
            </label>
            <label>
              <span>ease</span>
              <select name="ease" data-field="ease" defaultValue={v.ease}>
                {YOURS_EASES.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>position</span>
              <select name="position" data-field="position" defaultValue={v.position}>
                {YOURS_POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <div className={s.controls}>
              <button type="submit" className={s.easeButton} data-yours-play>
                {c.play ?? "Play"}
              </button>
              <button type="button" className={s.easeButton} data-yours-reverse>
                {c.reverse ?? "Reverse"}
              </button>
              <button type="button" className={s.easeButton} data-yours-copy>
                {c.copy ?? "Copy"}
              </button>
            </div>
            <p className={s.status} data-yours-status role="status" aria-live="polite" />
          </form>
        </div>
      </Foot>
      <YoursMotion />
    </Field>
  );
}

/** Źródła i kolofon pod YOURS: zieleń, body w mięcie. Wersje bibliotek z package.json w czasie builda. */
export function Sources() {
  const c = copy("sources");
  const author = copy("author");
  const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as { dependencies: Record<string, string>; devDependencies: Record<string, string> };
  const versions = [
    ["next", pkg.dependencies.next],
    ["gsap", pkg.dependencies.gsap],
    ["@gsap/react", pkg.dependencies["@gsap/react"]],
    ["sass", pkg.devDependencies.sass],
    ["@playwright/test", pkg.devDependencies["@playwright/test"]],
  ];
  const paint = chapter("yours");
  return (
    <footer className={s.sources} data-sources id="sources" aria-label={c.title} style={paintVars(paint) as CSSProperties}>
      <p className={s.index} data-line="index">
        {c.title}
      </p>
      <ul className={s.links}>
        {(c.link ?? []).map(({ label, url }) => (
          <li key={url}>
            <a href={url} rel="noopener">
              {label}
            </a>
          </li>
        ))}
      </ul>
      <p className={s.colophon} data-line="colophon">
        {c.colophon} {versions.map(([n, v]) => `${n} ${v}`).join(" · ")}.
      </p>
      {/* Autor: portfolio i sociale z COPY.md (## author). */}
      <p className={s.index} data-line="index">
        {author.title}
      </p>
      <ul className={s.links} data-author>
        {(author.link ?? []).map(({ label, url }) => (
          <li key={url}>
            <a href={url} rel="noopener me">
              {label}
            </a>
          </li>
        ))}
      </ul>
      <p className={s.colophon}>
        <a href="#top" data-top>
          {c.top ?? "Back to the top"}
        </a>
      </p>
    </footer>
  );
}
