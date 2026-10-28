import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "@playwright/test";
import { CHAPTERS } from "../src/lib/palette";

// npm run shots <faza>: screenshot każdego rozdziału na 1440 i 390 do docs/media/<faza>/.
const phase = process.env.SHOTS_PHASE;
test.skip(!phase, "set SHOTS_PHASE (npm run shots p0)");

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];

for (const vp of VIEWPORTS) {
  test(`shots at ${vp.width}`, async ({ browser }) => {
    const dir = join(process.cwd(), "docs", "media", phase!);
    mkdirSync(dir, { recursive: true });
    const context = await browser.newContext({ viewport: vp });
    const page = await context.newPage();
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    for (const c of CHAPTERS) {
      await page.evaluate((id) => document.querySelector(`[data-chapter="${id}"]`)!.scrollIntoView({ block: "start" }), c.id);
      // Stan spoczynku: cięcie (0.6 s) ma czas wystartować, potem żadne cięcie w toku i żaden rozdział w intro (maks. 8 s).
      await page.waitForTimeout(800);
      await page.waitForFunction(() => document.documentElement.dataset.cutState !== "cutting" && !document.querySelector('[data-phase="intro"]'), null, { timeout: 8000 }).catch(() => {});
      await page.evaluate((id) => document.querySelector(`[data-chapter="${id}"]`)!.scrollIntoView({ block: "start" }), c.id);
      await page.waitForTimeout(250);
      await page.screenshot({ path: join(dir, `0${c.index}-${c.id}-${vp.width}.png`) });
    }
    await context.close();
  });
}
