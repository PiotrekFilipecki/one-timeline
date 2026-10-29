import { expect, test } from "@playwright/test";
import { cutTo, wheelThroughScrub } from "./harness";

// fps na siatce STAGGER i w SCRUB przy 4× spowolnieniu CPU (CDP Emulation.setCPUThrottlingRate).
// Metoda: rAF co klatkę przez okno pomiaru; fps = klatki / czas; długie klatki = odstęp > 50 ms.

type Frames = { count: number; ms: number; long: number; worst: number };

const measure = (page: import("@playwright/test").Page, ms: number) =>
  page.evaluate(
    (ms) =>
      new Promise<Frames>((resolve) => {
        const t0 = performance.now();
        let last = t0;
        let count = 0;
        let long = 0;
        let worst = 0;
        const tick = () => {
          const now = performance.now();
          const dt = now - last;
          last = now;
          count++;
          if (dt > 50) long++;
          worst = Math.max(worst, dt);
          if (now - t0 < ms) requestAnimationFrame(tick);
          else resolve({ count, ms: now - t0, long, worst });
        };
        requestAnimationFrame(tick);
      }),
    ms,
  );

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("ot-opened", "1");
    } catch {}
  });
});

for (const vp of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844 },
]) {
  test(`${vp.name}: STAGGER grid and SCRUB hold frame rate at 4× CPU slowdown`, async ({ browser }) => {
    test.setTimeout(90_000);
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.goto("/");
    await page.waitForTimeout(500);

    // STAGGER: pomiar w trakcie intro (3 przejścia, ~4.6 s).
    const top = await page.locator('[data-chapter="stagger"]').evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top - vp.height * 0.75);
    await page.waitForFunction(() => document.documentElement.getAttribute("data-cut-stagger") === "after", null, { timeout: 8000 });
    const grid = await page.locator('[data-chapter="stagger"]').getAttribute("data-grid-size");
    const stagger = await measure(page, 3500);
    const staggerFps = (stagger.count / stagger.ms) * 1000;

    // SCRUB: pomiar w trakcie przewijania przez przypięty zakres.
    await cutTo(page, "scrub");
    const scrubP = measure(page, 2200);
    await wheelThroughScrub(page, 30, 60);
    const scrub = await scrubP;
    const scrubFps = (scrub.count / scrub.ms) * 1000;

    console.log(`${vp.name} @4× CPU | STAGGER grid ${grid}: ${staggerFps.toFixed(1)} fps, long frames (>50 ms) ${stagger.long}/${stagger.count}, worst ${stagger.worst.toFixed(0)} ms | SCRUB: ${scrubFps.toFixed(1)} fps, long ${scrub.long}/${scrub.count}, worst ${scrub.worst.toFixed(0)} ms`);
    expect(staggerFps, "STAGGER ≥ 30 fps at 4× slowdown").toBeGreaterThanOrEqual(30);
    expect(scrubFps, "SCRUB ≥ 30 fps at 4× slowdown").toBeGreaterThanOrEqual(30);
    await context.close();
  });
}
