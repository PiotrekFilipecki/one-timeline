import { mkdirSync, renameSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test, type Browser } from "@playwright/test";
import { wheelThroughScrub } from "./harness";

// npm run shots p2: klatka w trakcie każdego rozdziału i każdego cięcia (1440 i 390) oraz nagranie
// całego przewinięcia od hero do pola mięty.
const phase = process.env.SHOTS_PHASE;
test.skip(phase !== "p2", "set SHOTS_PHASE=p2");

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
const dir = join(process.cwd(), "docs", "media", "p2");
const CHAPTERS = ["position", "ease", "stagger", "scrub", "reverse", "cost"] as const;

async function fresh(browser: Browser, vp: { width: number; height: number }, video = false) {
  const context = await browser.newContext({ viewport: vp, recordVideo: video ? { dir, size: vp } : undefined });
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem("ot-opened", "1");
    } catch {}
  });
  const page = await context.newPage();
  return { context, page };
}

for (const vp of VIEWPORTS) {
  test(`frames at ${vp.width}`, async ({ browser }) => {
    test.setTimeout(120_000);
    mkdirSync(dir, { recursive: true });
    const { context, page } = await fresh(browser, vp);
    await page.goto("/");
    await page.waitForTimeout(6500);
    for (const id of CHAPTERS) {
      // Cięcie mogło już zagrać (np. kółko przez SCRUB dojechało do progu REVERSE): wtedy bez drugiego progu.
      const already = (await page.locator("html").getAttribute(`data-cut-${id}`)) === "after";
      if (!already) {
        const top = await page.locator(`[data-chapter="${id}"]`).evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top - vp.height * 0.75);
        await page.waitForTimeout(330);
        await page.screenshot({ path: join(dir, `cut-${id}-50-${vp.width}.png`) });
        await page.waitForFunction((id) => document.documentElement.getAttribute(`data-cut-${id}`) === "after", id, { timeout: 5000 });
      }
      if (id === "scrub") {
        // Przypięty zakres = 1 kadr: 6 + 6 kroków po 1/12 kadru = dokładnie koniec pinu, bez przeskoku do REVERSE.
        await wheelThroughScrub(page, 6, 40, 0.5);
        await page.waitForTimeout(300);
        await page.screenshot({ path: join(dir, `scrub-mid-${vp.width}.png`) });
        await wheelThroughScrub(page, 6, 40, 0.5);
        await page.waitForTimeout(900);
        await page.screenshot({ path: join(dir, `scrub-end-${vp.width}.png`) });
        continue;
      }
      await page.waitForTimeout(id === "ease" ? 1300 : id === "stagger" ? 700 : id === "reverse" ? 2200 : 700);
      await page.screenshot({ path: join(dir, `${id}-mid-${vp.width}.png`) });
      await page.waitForFunction((id) => (document.querySelector(`[data-chapter="${id}"]`) as HTMLElement).dataset.phase !== "intro", id, { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(250);
      await page.screenshot({ path: join(dir, `${id}-rest-${vp.width}.png`) });
    }
    await context.close();
  });

  test(`video at ${vp.width}`, async ({ browser }) => {
    test.setTimeout(180_000);
    mkdirSync(dir, { recursive: true });
    const before = new Set(readdirSync(dir));
    const { context, page } = await fresh(browser, vp, true);
    await page.goto("/");
    await page.waitForTimeout(6000);
    const costTop = await page.locator('[data-chapter="cost"]').evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    let guard = 0;
    while ((await page.evaluate(() => window.scrollY)) < costTop - 10 && guard++ < 400) {
      await page.mouse.wheel(0, Math.round(vp.height * 0.06));
      await page.waitForTimeout(70);
      // Po cięciu daj rozdziałowi zagrać, zanim pojedziesz dalej.
      if (await page.evaluate(() => document.documentElement.dataset.cutting === "true")) await page.waitForTimeout(700);
      if (await page.evaluate(() => !!document.querySelector('[data-phase="intro"]'))) await page.waitForTimeout(400);
    }
    await page.waitForTimeout(2500);
    await context.close();
    const created = readdirSync(dir).filter((f) => f.endsWith(".webm") && !before.has(f));
    for (const f of created) renameSync(join(dir, f), join(dir, `hero-to-mint-${vp.width}.webm`));
  });
}
