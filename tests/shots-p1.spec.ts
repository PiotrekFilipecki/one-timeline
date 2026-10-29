import { mkdirSync, renameSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test, type Browser } from "@playwright/test";

// npm run shots p1: klatki w trakcie (hero w połowie intro, hero w spoczynku, POSITION w trakcie skoków,
// cięcie w 50 %) na 1440 i 390 oraz nagrania hero → POSITION w spoczynku (webm).
const phase = process.env.SHOTS_PHASE;
test.skip(phase !== "p1", "set SHOTS_PHASE=p1");

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const dir = join(process.cwd(), "docs", "media", "p1");

async function fresh(browser: Browser, vp: { width: number; height: number }, video = false) {
  const context = await browser.newContext({ viewport: vp, recordVideo: video ? { dir, size: vp } : undefined });
  const page = await context.newPage();
  return { context, page };
}

for (const vp of VIEWPORTS) {
  test(`frames at ${vp.width}`, async ({ browser }) => {
    mkdirSync(dir, { recursive: true });
    const { context, page } = await fresh(browser, vp);
    await page.goto("/");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(dir, `hero-mid-intro-${vp.width}.png`) });
    await page.waitForTimeout(5500);
    await page.screenshot({ path: join(dir, `hero-rest-${vp.width}.png`) });

    const positionTop = await page.locator('[data-chapter="position"]').evaluate((el) => (el as HTMLElement).offsetTop);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), positionTop - vp.height * 0.75);
    await page.waitForTimeout(330);
    await page.screenshot({ path: join(dir, `cut-50-${vp.width}.png`) });
    await page.waitForFunction(() => document.documentElement.getAttribute("data-cut-position") === "after", null, { timeout: 5000 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: join(dir, `position-jumping-${vp.width}.png`) });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(dir, `position-rest-${vp.width}.png`) });
    await context.close();
  });

  test(`video at ${vp.width}`, async ({ browser }) => {
    mkdirSync(dir, { recursive: true });
    const before = new Set(readdirSync(dir));
    const { context, page } = await fresh(browser, vp, true);
    await page.goto("/");
    await page.waitForTimeout(6500);
    const positionTop = await page.locator('[data-chapter="position"]').evaluate((el) => (el as HTMLElement).offsetTop);
    // Przewinięcie kółkiem, krokami, jak użytkownik.
    for (let y = 0; y < positionTop; y += Math.round(vp.height * 0.08)) {
      await page.mouse.wheel(0, Math.round(vp.height * 0.08));
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(4500);
    await context.close();
    const created = readdirSync(dir).filter((f) => f.endsWith(".webm") && !before.has(f));
    for (const f of created) renameSync(join(dir, f), join(dir, `hero-to-position-${vp.width}.webm`));
  });
}
