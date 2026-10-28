import { expect, test } from "@playwright/test";
import { WIDTHS, diffBoxes, installRecorder, noHorizontalScroll, readSamples, shifts, snapshotBoxes } from "./harness";

// Harness przesunięć układu na 7 szerokościach: od pierwszej widocznej klatki, przez całe intro hero
// (6 s), po stanie spoczynku, oraz przy hover i focus każdego słowa zdania i przycisku Replay:
// boxy słów i linijek się nie zmieniają (bez zaokrąglania), nie ma poziomego scrolla.

for (const width of WIDTHS) {
  test(`${width}px: 0 layout shifts through the hero intro, at rest, on hover and focus`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 } });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await installRecorder(page, { ms: 6500 });
    await page.goto("/");
    await page.waitForTimeout(6800);
    expect(errors, "no runtime errors (a failed motion core must never blank the page)").toEqual([]);
    expect(await page.locator("html").getAttribute("data-motion-ready"), "beat / beat-exit registered").toBe("true");
    await expect(page.locator('[data-chapter="hero"]')).toHaveAttribute("data-phase", "rest");

    const samples = await readSamples(page);
    expect(samples.length, "recorder saw visible frames").toBeGreaterThan(10);
    expect(samples[0].fonts, "first visible frame already has fonts loaded").toBe("loaded");
    expect(samples[samples.length - 1].boot, "boot gate released").not.toBe("pending");
    const moved = shifts(samples);
    expect(moved, `shifts during intro at ${width}px:\n${moved.slice(0, 20).join("\n")}`).toEqual([]);

    // Hover i focus każdego słowa zdania oraz Replay: nic poza nimi się nie rusza, a one trzymają box.
    const rest = await snapshotBoxes(page);
    const words = page.locator('[data-chapter="hero"] [data-word-key]');
    const n = await words.count();
    expect(n).toBe(6);
    for (let i = 0; i < n; i++) {
      const w = words.nth(i);
      await w.hover();
      await page.waitForTimeout(350);
      const hot = await snapshotBoxes(page);
      expect(diffBoxes(rest, hot), `hover word ${i} at ${width}px`).toEqual([]);
      await page.mouse.move(0, 0);
      await page.waitForTimeout(450);
      await w.focus();
      await page.waitForTimeout(350);
      const focused = await snapshotBoxes(page);
      expect(diffBoxes(rest, focused), `focus word ${i} at ${width}px`).toEqual([]);
      await w.blur();
      await page.waitForTimeout(450);
    }
    await page.locator("[data-replay]").focus();
    await page.waitForTimeout(200);
    expect(diffBoxes(rest, await snapshotBoxes(page)), `focus Replay at ${width}px`).toEqual([]);
    expect(diffBoxes(rest, await snapshotBoxes(page)), `after all hovers at ${width}px`).toEqual([]);
    console.log(`${width}px: ${samples.length} frames, ${Object.keys(samples[0].boxes).length} boxes, 0 shifts; hover/focus ×${n} + Replay: 0 shifts`);

    const scroll = await noHorizontalScroll(page);
    expect(scroll.scrollWidth, `horizontal scroll at ${width}px`).toBeLessThanOrEqual(scroll.clientWidth);
    await context.close();
  });
}
