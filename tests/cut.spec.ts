import { expect, test } from "@playwright/test";
import { CHAPTERS, chapter } from "../src/lib/palette";
import { hexToCss } from "../src/lib/contrast";

// Cięcie hero → POSITION: po progu pole pod środkiem kadru = śliwka, po powrocie = róż,
// pięć szybkich przejść przez próg nie kolejkuje animacji (maks. 2 odegrania: tam i z powrotem).

const centerColor = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    let el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    while (el) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)") return bg;
      el = el.parentElement;
    }
    return "none";
  });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("ot-opened", "1");
    } catch {}
  });
});

test("the dot grows into the plum field, scrolling back plays it in reverse", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(400);
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-cut-position", "before");
  const positionTop = await page.locator('[data-chapter="position"]').evaluate((el) => (el as HTMLElement).offsetTop);
  const vh = page.viewportSize()!.height;

  // Próg: górna krawędź POSITION na 80 % kadru.
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), positionTop - vh * 0.75);
  await expect(html).toHaveAttribute("data-cut-position", "cutting");
  await expect(html).toHaveAttribute("data-cut-position", "after", { timeout: 3000 });
  expect(await centerColor(page), "field under the cursor after the cut is plum").toBe(hexToCss(chapter("position").bg));
  expect(await page.evaluate(() => window.scrollY), "document jumped to POSITION").toBe(positionTop);
  await expect(page.locator('[data-chapter="position"]')).toHaveAttribute("data-phase", /intro|rest/);

  // Wstecz: przewinięcie w górę za próg 20 % gra cięcie w drugą stronę.
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), positionTop - vh * 0.3);
  await expect(html).toHaveAttribute("data-cut-position", "cutting");
  await expect(html).toHaveAttribute("data-cut-position", "before", { timeout: 3000 });
  expect(await centerColor(page), "field after the reverse cut is pink").toBe(hexToCss(CHAPTERS[0].bg));
  expect(await page.locator("html").getAttribute("data-cut-plays")).toBe("2");
});

test("five fast crossings of the threshold do not queue cuts", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(400);
  const positionTop = await page.locator('[data-chapter="position"]').evaluate((el) => (el as HTMLElement).offsetTop);
  const vh = page.viewportSize()!.height;
  for (let i = 0; i < 5; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), positionTop - vh * 0.75);
    await page.waitForTimeout(40);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), positionTop - vh * 1.1);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(2500);
  const plays = Number(await page.locator("html").getAttribute("data-cut-plays"));
  const state = await page.locator("html").getAttribute("data-cut-position");
  console.log(`plays after 5 fast crossings: ${plays}, final state: ${state}`);
  expect(plays, "at most one cut each way, no queue").toBeLessThanOrEqual(2);
  expect(state).not.toBe("cutting");
  // Stan zgodny z pozycją dokumentu: ostatni skok był w górę, więc hero.
  expect(state).toBe("before");
  expect(await centerColor(page)).toBe(hexToCss(CHAPTERS[0].bg));
});
