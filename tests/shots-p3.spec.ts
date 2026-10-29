import { mkdirSync, renameSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { test, type Browser } from "@playwright/test";
import { cutTo } from "./harness";

// npm run shots p3: klatka COST w trybie jank (czerwone pole), nagrania COST i YOURS (1440 i 390),
// screenshot całej strony bez JS i z reduced motion (pełna wysokość).
const phase = process.env.SHOTS_PHASE;
test.skip(phase !== "p3", "set SHOTS_PHASE=p3");

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const dir = join(process.cwd(), "docs", "media", "p3");

async function fresh(browser: Browser, vp: { width: number; height: number }, opts: { video?: boolean; js?: boolean; reduced?: boolean } = {}) {
  const context = await browser.newContext({
    viewport: vp,
    // Osobny katalog per szerokość: dwa testy nagrywają równolegle i nie mogą sobie podbierać plików.
    recordVideo: opts.video ? { dir: join(dir, `tmp-${vp.width}`), size: vp } : undefined,
    javaScriptEnabled: opts.js ?? true,
    reducedMotion: opts.reduced ? "reduce" : "no-preference",
  });
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem("ot-opened", "1");
    } catch {}
  });
  const page = await context.newPage();
  return { context, page };
}

for (const vp of VIEWPORTS) {
  test(`COST and YOURS frames and video at ${vp.width}`, async ({ browser }) => {
    test.setTimeout(180_000);
    mkdirSync(dir, { recursive: true });
    const tmp = join(dir, `tmp-${vp.width}`);
    const { context, page } = await fresh(browser, vp, { video: true });
    const cdp = await context.newCDPSession(page);
    await page.goto("/");
    await page.waitForTimeout(400);
    await cutTo(page, "cost");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(dir, `cost-transform-${vp.width}.png`) });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 12 });
    await page.locator("[data-cost-mode]").click();
    await page.waitForFunction(() => document.querySelector('[data-chapter="cost"]')!.hasAttribute("data-jank"), null, { timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(dir, `cost-jank-${vp.width}.png`) });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    await page.locator("[data-cost-mode]").click();
    await page.waitForTimeout(1200);
    await cutTo(page, "yours");
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(dir, `yours-rest-${vp.width}.png`) });
    await page.locator("[data-yours-play]").click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(dir, `yours-playing-${vp.width}.png`) });
    await page.waitForTimeout(2500);
    await page.locator("[data-yours-reverse]").click();
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    await page.waitForTimeout(330);
    await page.screenshot({ path: join(dir, `loop-50-${vp.width}.png`) });
    await page.waitForTimeout(2000);
    await context.close();
    for (const f of readdirSync(tmp).filter((f) => f.endsWith(".webm"))) renameSync(join(tmp, f), join(dir, `cost-yours-loop-${vp.width}.webm`));
    rmSync(tmp, { recursive: true, force: true });
  });

  test(`full page without JavaScript and with reduced motion at ${vp.width}`, async ({ browser }) => {
    test.setTimeout(120_000);
    mkdirSync(dir, { recursive: true });
    const a = await fresh(browser, vp, { js: false });
    await a.page.goto("/");
    await a.page.waitForTimeout(500);
    await a.page.screenshot({ path: join(dir, `full-nojs-${vp.width}.png`), fullPage: true });
    await a.context.close();
    const b = await fresh(browser, vp, { reduced: true });
    await b.page.goto("/");
    await b.page.waitForTimeout(800);
    await b.page.screenshot({ path: join(dir, `full-reduced-${vp.width}.png`), fullPage: true });
    await b.context.close();
  });
}
