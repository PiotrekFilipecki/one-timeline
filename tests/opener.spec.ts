import { expect, test } from "@playwright/test";
import { CHAPTERS } from "../src/lib/palette";
import { hexToCss } from "../src/lib/contrast";

// Opener: osiem pasków naraz, wychodzą po kolei. Rejestracja koloru pod trzema punktami ekranu co klatkę:
// w żadnym oknie 1 s nie więcej niż 3 zmiany (WCAG 2.3.1). Tylko przy pierwszym wejściu w sesji.

type Frame = { t: number; colors: string[] };

test("opener plays once per session, with at most 3 field changes per second at any point", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __frames: Frame[] };
    w.__frames = [];
    const t0 = performance.now();
    const probe = (x: number, y: number) => {
      // Paski mają pointer-events: none, więc elementFromPoint je pomija: sprawdź ich geometrię wprost.
      for (const bar of Array.from(document.querySelectorAll<HTMLElement>("[data-opener-bars] > *"))) {
        const cs = getComputedStyle(bar);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        const r = bar.getBoundingClientRect();
        if (x >= r.left && x < r.right && y >= r.top && y < r.bottom) return cs.backgroundColor;
      }
      let el = document.elementFromPoint(x, y);
      while (el) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
        el = el.parentElement;
      }
      return "none";
    };
    const tick = () => {
      const vw = innerWidth;
      const vh = innerHeight;
      // Środki pasków 1, 4 i 7 (śliwka, żółty, zieleń). Pasek 0 jest różowy jak pole hero, więc nic by nie pokazał.
      w.__frames.push({ t: performance.now() - t0, colors: [probe((vw * 1.5) / 8, vh * 0.5), probe((vw * 4.5) / 8, vh * 0.5), probe((vw * 7.5) / 8, vh * 0.5)] });
      if (performance.now() - t0 < 2500) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.goto("/");
  await page.waitForTimeout(2700);
  const frames = await page.evaluate(() => (window as unknown as { __frames: Frame[] }).__frames);
  expect(frames.length).toBeGreaterThan(60);

  const pink = hexToCss(CHAPTERS[0].bg);
  const palette = CHAPTERS.map((c) => hexToCss(c.bg));
  for (let point = 0; point < 3; point++) {
    const series = frames.map((f) => ({ t: f.t, c: f.colors[point] }));
    const changes: number[] = [];
    for (let i = 1; i < series.length; i++) if (series[i].c !== series[i - 1].c) changes.push(series[i].t);
    let worst = 0;
    for (let i = 0; i < changes.length; i++) {
      let n = 1;
      for (let j = i + 1; j < changes.length && changes[j] - changes[i] <= 1000; j++) n++;
      worst = Math.max(worst, n);
    }
    console.log(`point ${point}: first ${series[0].c}, ${changes.length} change(s), max ${worst}/s, final ${series[series.length - 1].c}`);
    expect(palette, `first color at point ${point} is one of the 8 fields`).toContain(series[0].c);
    expect(series[0].c, `point ${point} starts on an opener bar, not on the pink field`).not.toBe(pink);
    expect(changes.length, `point ${point} changes exactly once (bar leaves, pink stays)`).toBe(1);
    expect(worst, `changes within any 1 s window at point ${point}`).toBeLessThanOrEqual(3);
    expect(series[series.length - 1].c, "lands on pink").toBe(pink);
  }
  await expect(page.locator("html")).toHaveAttribute("data-opener", "skip");

  // Drugie wejście w tej samej sesji: bez openera.
  await page.reload();
  await page.waitForTimeout(200);
  await expect(page.locator("html")).toHaveAttribute("data-opener", "skip");
  await expect(page.locator("[data-opener-bars]")).toBeHidden();
});
