/** Głowica: hairline w kolorze typografii. SSR, bez JS ukryta (data-needs-js). Zachowanie dokłada attachPlayhead. */
export function Playhead({ label }: { label: string }) {
  return (
    <div
      data-playhead
      data-needs-js
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={100}
      aria-orientation="horizontal"
    >
      <span aria-hidden="true" />
    </div>
  );
}
