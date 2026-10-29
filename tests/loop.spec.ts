import { expect, test } from "@playwright/test";
import { CHAPTERS } from "../src/lib/palette";
import { hexToCss } from "../src/lib/contrast";
import { waitForRest } from "./harness";

// Pętla: koniec dokumentu → ostatnie cięcie (S z YOURS) zalewa kadr różem i przewija na górę do hero
// w spoczynku, bez ponownego openera. Link „Back to the top" robi to samo z klawiatury; bez JS jest kotwicą.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("ot-opened", "1");
    } catch {}
  });
});

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

test("scrolling to the end plays the pink loop cut back to the hero at rest", async ({ page }) => {
  await page.goto("/");
  await waitForRest(page, "hero");
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect(page.locator("html")).toHaveAttribute("data-cut-loop", "cutting");
  await page.waitForTimeout(350);
  // W połowie: koło w kolorze hero (róż) rośnie.
  await expect(page.locator("[data-cut]")).toHaveCSS("background-color", hexToCss(CHAPTERS[0].bg));
  await expect(page.locator("html")).toHaveAttribute("data-cut-loop", "before", { timeout: 3000 });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(await centerColor(page)).toBe(hexToCss(CHAPTERS[0].bg));
  await expect(page.locator('[data-chapter="hero"]')).toHaveAttribute("data-phase", "rest");
  await expect(page.locator("[data-opener-bars]")).toBeHidden();
  expect(await page.locator('[data-chapter="hero"] .ch').count(), "no replay of the sentence").toBe(0);
});

test("the Back to the top link plays the loop from the keyboard", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(300);
  await page.locator("[data-top]").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-cut-loop", "cutting");
  await expect(page.locator("html")).toHaveAttribute("data-cut-loop", "before", { timeout: 3000 });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
