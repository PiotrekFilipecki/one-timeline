import { BLOB_PATTERN, BLOB_SHAPES, easeCurvePath } from "@/lib/blob";
import { EASE_REST } from "@/lib/eases";
import s from "./Poster.module.scss";

/**
 * EASE: krzywa easingu rysowana kreską przez scenę (DrawSVG w intro, MorphSVG przy zmianie przycisku) i blob-kulka,
 * która po niej jedzie (MotionPath). SSR: krzywa spoczynku (expo.out) w całości, kulka na jej końcu.
 */
export function EaseCurve() {
  return (
    <svg className={s.curve} data-ease-scene viewBox="0 0 1000 400" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="blob-pattern-ease" data-blob-pattern patternUnits="userSpaceOnUse" width={BLOB_PATTERN.size} height={BLOB_PATTERN.size} patternTransform={`rotate(${BLOB_PATTERN.rotate}) scale(1)`}>
          <circle data-blob-dot cx={BLOB_PATTERN.size / 2} cy={BLOB_PATTERN.size / 2} r={BLOB_PATTERN.r} fill="var(--fg)" />
        </pattern>
      </defs>
      <path data-ease-curve d={easeCurvePath(EASE_REST)} fill="none" stroke="var(--fg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <g data-blob data-blob-rest="ball" data-ease-ball transform="translate(1000 60)">
        <g transform="scale(0.5) translate(-100 -100)">
          <path data-blob-shape d={BLOB_SHAPES.ball} fill="url(#blob-pattern-ease)" stroke="var(--fg)" strokeWidth="5" />
        </g>
      </g>
    </svg>
  );
}
