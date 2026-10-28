/** Znacznik czasu jak na timeline: 0.9 → "0:00.90", 61.25 → "1:01.25". */
export function formatTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  const whole = Math.floor(rest);
  const hundredths = Math.round((rest - whole) * 100);
  const sec = hundredths === 100 ? whole + 1 : whole;
  const hh = hundredths === 100 ? 0 : hundredths;
  return `${m}:${String(sec).padStart(2, "0")}.${String(hh).padStart(2, "0")}`;
}
