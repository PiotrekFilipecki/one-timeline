/** Znacznik czasu jak na timeline: 0.9 → "0:00.90", 61.25 → "1:01.25". Zaokrąglenie do setnych przenosi się
 *  w górę przez sekundy i minuty (59.996 → "1:00.00"). */
export function formatTime(seconds: number): string {
  const total = Math.round(Math.max(0, seconds) * 100);
  const m = Math.floor(total / 6000);
  const s = Math.floor((total % 6000) / 100);
  const hh = total % 100;
  return `${m}:${String(s).padStart(2, "0")}.${String(hh).padStart(2, "0")}`;
}
