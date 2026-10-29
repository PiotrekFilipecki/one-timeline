import { expect, test } from "@playwright/test";
import { CHAPTERS, chapter } from "../src/lib/palette";
import { hexToCss } from "../src/lib/contrast";
import { cutTo, waitForRest } from "./harness";

// Łańcuch kolorów przez cięcia: po każdym cięciu pole pod środkiem kadru = typografia poprzedniego rozdziału,
// a następny rozdział gra i staje. Hero → POSITION → EASE → STAGGER → SCRUB → REVERSE → pole COST.

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

test("every cut lands on the previous chapter's typography color and the next chapter plays once", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await waitForRest(page, "hero");
  const ids = CHAPTERS.map((c) => c.id);
  for (let i = 1; i < ids.length; i++) {
    const from = chapter(ids[i - 1]);
    const to = chapter(ids[i]);
    await cutTo(page, to.id);
    const color = await centerColor(page);
    expect(color, `${to.id}: field = ${from.names.fg}`).toBe(hexToCss(to.bg));
    expect(to.bg, `${from.id} typography → ${to.id} field`).toBe(from.fg);
    const phase = await page.locator(`[data-chapter="${to.id}"]`).getAttribute("data-phase");
    console.log(`${from.id} → ${to.id}: ${color}, phase ${phase ?? "(scroll/static)"}`);
    if (to.id === "position" || to.id === "ease" || to.id === "stagger" || to.id === "reverse") expect(phase).toBe("rest");
    if (to.id === "scrub") {
      // SCRUB: przewinięcie przez przypięty zakres zmienia osie, zero reflow sąsiadów (layout.spec), progress 0 → 1.
      await expect(page.locator('[data-chapter="scrub"]')).toHaveAttribute("data-scrub-ready", "");
      const vh = page.viewportSize()!.height;
      await page.mouse.wheel(0, vh);
      await page.waitForTimeout(900);
      const p = Number(await page.locator('[data-chapter="scrub"]').getAttribute("data-scrub"));
      expect(p).toBeGreaterThan(0.9);
      const stretch = await page.locator('[data-chapter="scrub"] [data-word="scrub"] .ch').first().evaluate((el) => getComputedStyle(el).fontStretch);
      console.log(`scrub progress ${p}, first letter font-stretch ${stretch}`);
      expect(parseFloat(stretch)).toBeGreaterThan(140);
    }
  }
  expect(Number(await page.locator("html").getAttribute("data-cut-plays"))).toBe(7);
});
