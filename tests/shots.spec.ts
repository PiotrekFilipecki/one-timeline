import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "@playwright/test";
import { CHAPTERS } from "../src/lib/palette";
import { cutTo, waitForRest } from "./harness";

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
    await waitForRest(page, "hero");
    for (const c of CHAPTERS) {
      // Skok przez próg cięcia jak w testach (window.scrollTo): scrollIntoView przewijałoby wrapper smoothera,
      // nie okno, i żadne cięcie by nie zagrało. Po cięciu dokument stoi na górze rozdziału, w spoczynku.
      if (c.id !== "hero") await cutTo(page, c.id);
      await page.waitForFunction(() => document.documentElement.dataset.cutting !== "true" && !document.querySelector('[data-phase="intro"]'), null, { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(250);
      await page.screenshot({ path: join(dir, `0${c.index}-${c.id}-${vp.width}.png`) });
    }
    await context.close();
  });
}
