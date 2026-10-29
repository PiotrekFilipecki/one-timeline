import { expect, test } from "@playwright/test";
import { WIDTHS, cutTo, diffBoxes, installRecorder, noHorizontalScroll, readSamples, record, shifts, snapshotBoxes, waitForRest, wheelThroughScrub } from "./harness";

// Harness przesunięć układu na 7 szerokościach: boot i intro hero (6.5 s), spoczynek, hover i focus słów
// i Replay, potem każdy rozdział P2 w trakcie intro po cięciu i SCRUB w trakcie przewijania przez przypięty
// zakres. Boxy liczone względem sekcji, bez własnej translacji; 0 przesunięć, bez zaokrąglania.

const CHAPTERS_P2 = ["position", "ease", "stagger", "scrub", "reverse", "cost", "yours"] as const;

for (const width of WIDTHS) {
  test(`${width}px: 0 layout shifts through hero, hover/focus, every chapter intro and SCRUB`, async ({ browser }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 } });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await installRecorder(page, { ms: 6500 });
    await page.goto("/");
    // Opener + zdanie ≈ 6.3 s; bramka na fazie, nie na czasie. Rekorder (6.5 s) dojeżdża w tle.
    await waitForRest(page, "hero");
    expect(errors, "no runtime errors (a failed motion core must never blank the page)").toEqual([]);
    expect(await page.locator("html").getAttribute("data-motion-ready"), "beat / beat-exit registered").toBe("true");

    const samples = await readSamples(page);
    expect(samples.length, "recorder saw visible frames").toBeGreaterThan(10);
    expect(samples[0].fonts, "first visible frame already has fonts loaded").toBe("loaded");
    expect(samples[samples.length - 1].boot, "boot gate released").not.toBe("pending");
    const moved = shifts(samples);
    expect(moved, `shifts during hero intro at ${width}px:\n${moved.slice(0, 20).join("\n")}`).toEqual([]);

    // Hover i focus każdego słowa zdania oraz Replay.
    const rest = await snapshotBoxes(page);
    const words = page.locator('[data-chapter="hero"] [data-word-key]');
    const n = await words.count();
    expect(n).toBe(6);
    for (let i = 0; i < n; i++) {
      const w = words.nth(i);
      await w.hover();
      await page.waitForTimeout(350);
      expect(diffBoxes(rest, await snapshotBoxes(page)), `hover word ${i} at ${width}px`).toEqual([]);
      await page.mouse.move(0, 0);
      await page.waitForTimeout(450);
      await w.focus();
      await page.waitForTimeout(350);
      expect(diffBoxes(rest, await snapshotBoxes(page)), `focus word ${i} at ${width}px`).toEqual([]);
      await w.blur();
      await page.waitForTimeout(450);
    }
    await page.locator("[data-replay]").focus();
    await page.waitForTimeout(200);
    expect(diffBoxes(rest, await snapshotBoxes(page)), `focus Replay at ${width}px`).toEqual([]);

    // Rozdziały P2: cięcie, intro, spoczynek; SCRUB: przewinięcie przez przypięty zakres.
    const report: string[] = [`${width}px: hero ${samples.length} frames, ${Object.keys(samples[0].boxes).length} boxes, 0 shifts; hover/focus ×${n} + Replay: 0`];
    for (const id of CHAPTERS_P2) {
      await record(page, { ms: id === "scrub" ? 4000 : id === "cost" || id === "yours" ? 2500 : 5500 });
      await cutTo(page, id);
      if (id === "scrub") await wheelThroughScrub(page);
      if (id === "cost") await page.locator("[data-cost-mode]").click();
      if (id === "yours") await page.locator("[data-yours-play]").click();
      // Rozdziały z kontrolerem: cutTo czeka na spoczynek. SCRUB (po przewinięciu), COST (tryb) i YOURS (Play) grają bez fazy.
      if (id === "scrub") await page.waitForTimeout(800);
      else if (id === "cost" || id === "yours") await page.waitForTimeout(2600);
      const s = await readSamples(page);
      const m = shifts(s);
      expect(m, `shifts in ${id} at ${width}px:\n${m.slice(0, 20).join("\n")}`).toEqual([]);
      report.push(`${id}: ${s.length} frames, 0 shifts`);
    }
    console.log(report.join(" | "));
    expect(errors, "no runtime errors through the chapters").toEqual([]);

    const scroll = await noHorizontalScroll(page);
    expect(scroll.scrollWidth, `horizontal scroll at ${width}px`).toBeLessThanOrEqual(scroll.clientWidth);
    await context.close();
  });
}
