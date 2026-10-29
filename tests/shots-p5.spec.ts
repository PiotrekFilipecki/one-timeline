import { mkdirSync, renameSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { test } from "@playwright/test";

// npm run shots p5: pełne nagranie strony (hero → pętla) na 1440 i 390; klatki spoczynku robi shots.spec.
const phase = process.env.SHOTS_PHASE;
test.skip(phase !== "p5", "set SHOTS_PHASE=p5");

const dir = join(process.cwd(), "docs", "media", "p5");

for (const vp of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`full page recording at ${vp.width}`, async ({ browser }) => {
    test.setTimeout(240_000);
    mkdirSync(dir, { recursive: true });
    const tmp = join(dir, `tmp-${vp.width}`);
    const context = await browser.newContext({ viewport: vp, recordVideo: { dir: tmp, size: vp } });
    const page = await context.newPage();
    await page.goto("/");
    await page.waitForTimeout(6500);
    // Koniec: pętla zagrała (licznik odegrań wzrósł po YOURS) albo limit kroków. Bez tego kółko kręciłoby się
    // w nieskończoność, bo pętla przewija dokument z powrotem na górę.
    const plays = () => page.evaluate(() => Number(document.documentElement.dataset.cutPlays ?? 0));
    let guard = 0;
    let yoursPlays = -1;
    while (guard++ < 400) {
      if (yoursPlays < 0 && (await page.evaluate(() => document.documentElement.getAttribute("data-cut-yours") === "after"))) yoursPlays = await plays();
      if (yoursPlays >= 0 && (await plays()) > yoursPlays) break;
      await page.mouse.wheel(0, Math.round(vp.height * 0.06));
      await page.waitForTimeout(70);
      if (await page.evaluate(() => document.documentElement.dataset.cutting === "true")) await page.waitForTimeout(700);
      if (await page.evaluate(() => !!document.querySelector('[data-phase="intro"]'))) await page.waitForTimeout(400);
      const cost = await page.evaluate(() => (document.querySelector('[data-chapter="cost"]') as HTMLElement).dataset.costInView === "true");
      if (cost && !(await page.evaluate(() => (document.querySelector("[data-cost-mode]") as HTMLElement).dataset.seen))) {
        await page.evaluate(() => ((document.querySelector("[data-cost-mode]") as HTMLElement).dataset.seen = "1"));
        await page.waitForTimeout(1500);
        await page.locator("[data-cost-mode]").dispatchEvent("click");
        await page.waitForTimeout(2500);
        await page.locator("[data-cost-mode]").dispatchEvent("click");
        await page.waitForTimeout(800);
      }
      if (await page.evaluate(() => document.documentElement.getAttribute("data-cut-yours") === "after" && !(document.querySelector("[data-yours-play]") as HTMLElement).dataset.seen)) {
        await page.evaluate(() => ((document.querySelector("[data-yours-play]") as HTMLElement).dataset.seen = "1"));
        await page.waitForTimeout(800);
        await page.locator("[data-yours-play]").dispatchEvent("click");
        await page.waitForTimeout(4500);
        await page.locator("[data-yours-reverse]").dispatchEvent("click");
        await page.waitForTimeout(4500);
      }
    }
    // Po pętli: hero w spoczynku.
    await page.waitForTimeout(2500);
    await context.close();
    for (const f of readdirSync(tmp).filter((f) => f.endsWith(".webm"))) renameSync(join(tmp, f), join(dir, `full-page-${vp.width}.webm`));
    rmSync(tmp, { recursive: true, force: true });
  });
}
