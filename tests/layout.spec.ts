import { expect, test } from "@playwright/test";
import { WIDTHS, installRecorder, noHorizontalScroll, readSamples, shifts } from "./harness";

// Harness przesunięć układu na 7 szerokościach: od pierwszej widocznej klatki boxy słów i linijek
// się nie zmieniają (fonty już załadowane, bez zaokrąglania), i nie ma poziomego scrolla.

for (const width of WIDTHS) {
  test(`${width}px: 0 layout shifts after first visible frame, no horizontal scroll`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 } });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await installRecorder(page, { ms: 2000 });
    await page.goto("/");
    await page.waitForTimeout(2300);
    expect(errors, "no runtime errors (a failed motion core must never blank the page)").toEqual([]);
    expect(await page.locator("html").getAttribute("data-motion-ready"), "beat / beat-exit registered").toBe("true");

    const samples = await readSamples(page);
    expect(samples.length, "recorder saw visible frames").toBeGreaterThan(10);
    expect(samples[0].fonts, "first visible frame already has fonts loaded").toBe("loaded");
    expect(samples[samples.length - 1].boot, "boot gate released").not.toBe("pending");

    const moved = shifts(samples);
    expect(moved, `shifts at ${width}px:\n${moved.slice(0, 20).join("\n")}`).toEqual([]);
    console.log(`${width}px: ${samples.length} frames, ${Object.keys(samples[0].boxes).length} boxes, 0 shifts, first visible at ${samples[0].t.toFixed(0)} ms`);

    const scroll = await noHorizontalScroll(page);
    expect(scroll.scrollWidth, `horizontal scroll at ${width}px`).toBeLessThanOrEqual(scroll.clientWidth);
    await context.close();
  });
}
