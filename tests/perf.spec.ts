import { expect, test } from "@playwright/test";
import { readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
import { cutTo, wheelThroughScrub } from "./harness";

// Jeden plik, tryb serial: pomiary nie mogą biec równolegle (LCP przy 3 workerach: 6.5 s, samemu: 0.5 s).
test.describe.configure({ mode: "serial" });

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


// Q2: LCP i CLS zimnego wejścia, rozmiar JS strony (z HTML builda), długie klatki (> 50 ms) per rozdział
// przy 4× CPU poza celowym jankiem w COST.

test("LCP, CLS and the JS the page ships", async ({ page, request }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __vitals: { lcp: number; cls: number; lcpEl: string; candidates: string[] } };
    w.__vitals = { lcp: 0, cls: 0, lcpEl: "", candidates: [] };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & { element?: Element; size?: number })[]) {
        w.__vitals.lcp = e.startTime;
        const el = e.element;
        const text = el ? (el.textContent ?? "").trim().slice(0, 12) : "";
        w.__vitals.lcpEl = el ? `${el.tagName.toLowerCase()} "${text}"` : "";
        w.__vitals.candidates.push(`${e.startTime.toFixed(0)}ms ${w.__vitals.lcpEl} ${e.size}px²`);
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!e.hadRecentInput) w.__vitals.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("/");
  await page.waitForTimeout(7000);
  const vitals = await page.evaluate(() => (window as unknown as { __vitals: { lcp: number; cls: number; lcpEl: string; candidates: string[] } }).__vitals);
  const fcp = await page.evaluate(() => performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? -1);
  const html = await (await request.get("/")).text();
  const scripts = [...new Set(Array.from(html.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)).map((m) => m[1]))];
  let raw = 0;
  let gz = 0;
  for (const s of scripts) {
    const f = join(process.cwd(), ".next", s.replace(/^\/_next\//, ""));
    raw += statSync(f).size;
    gz += gzipSync(readFileSync(f)).length;
  }
  console.log(`FCP ${fcp.toFixed(0)} ms, LCP ${vitals.lcp.toFixed(0)} ms (${vitals.lcpEl}), CLS ${vitals.cls.toFixed(4)}, JS ${scripts.length} chunks: ${(raw / 1024).toFixed(0)} KB raw / ${(gz / 1024).toFixed(0)} KB gzip, HTML ${(html.length / 1024).toFixed(0)} KB`);
  console.log(`LCP candidates: ${vitals.candidates.join(" → ")}`);
  expect(vitals.cls, "CLS").toBeLessThan(0.01);
  // LCP w definicji Chromium ląduje na ostatnim namalowanym słowie zdania hero (zdanie gra ~5 s), więc
  // twarda bramka jest na FCP i na pierwszym kandydacie LCP; wartość końcowa idzie do raportu.
  expect(fcp, "first contentful paint (localhost)").toBeLessThan(1000);
  const first = Number(vitals.candidates[0]?.split("ms")[0] ?? 0);
  expect(first, "first LCP candidate (localhost)").toBeLessThan(2500);
});


test("long frames per chapter at 4× CPU slowdown (COST jank excluded)", async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto("/");
  const hero = await measure(page, 6000);
  const rows = [`hero (opener + sentence): ${((hero.count / hero.ms) * 1000).toFixed(1)} fps, long ${hero.long}, worst ${hero.worst.toFixed(0)} ms`];
  const longs: string[] = [];
  if (hero.long) longs.push(`hero ${hero.long}`);
  for (const id of ["position", "ease", "stagger", "scrub", "reverse", "cost", "yours"] as const) {
    const p = measure(page, id === "scrub" ? 3000 : 4000);
    await cutTo(page, id, { settle: 10 });
    if (id === "scrub") await wheelThroughScrub(page, 30, 60);
    if (id === "yours") await page.locator("[data-yours-play]").click();
    const r = await p;
    rows.push(`${id}: ${((r.count / r.ms) * 1000).toFixed(1)} fps, long ${r.long}, worst ${r.worst.toFixed(0)} ms`);
    if (r.long) longs.push(`${id} ${r.long}`);
  }
  console.log(rows.join(" | "));
  // Start strony przy 4× CPU: jedna długa klatka (hydracja + split zdania hero przed zdjęciem bramki) jest
  // dopuszczalna; w trakcie ruchu żadnej. P4: 115 → 68 ms po rozłożeniu przygotowań rozdziałów pod kadrem na klatki.
  const inMotion = longs.filter((l) => !l.startsWith("hero"));
  expect(inMotion, `long frames outside COST's intentional jank: ${inMotion.join(", ")}`).toEqual([]);
  expect(hero.long, "at most one start-up long frame in hero").toBeLessThanOrEqual(1);
  await context.close();
});
