// node scripts/og.mjs  →  src/app/opengraph-image.png (1200×630): hero w spoczynku z działającego builda (port 3124).
// Prawdziwy font i ziarno, bez ImageResponse (next/og nie ma Anybody z next/font w czasie builda).
import { chromium } from "@playwright/test";

const url = process.env.OG_URL ?? "http://localhost:3124/";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await context.addInitScript(() => {
  try {
    sessionStorage.setItem("ot-opened", "1");
  } catch {}
});
const page = await context.newPage();
await page.goto(url);
await page.waitForFunction(() => document.querySelector('[data-chapter="hero"]')?.dataset.phase === "rest", null, { timeout: 20000 });
await page.waitForTimeout(300);
await page.screenshot({ path: new URL("../src/app/opengraph-image.png", import.meta.url).pathname });
await browser.close();
console.log("src/app/opengraph-image.png 1200×630");
