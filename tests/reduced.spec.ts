import { expect, test } from "@playwright/test";

// Reduced motion: żadnej bramki ani openera, wszystkie słowa w stanie spoczynku od pierwszej klatki,
// zero splitu, cięcie = natychmiastowa zmiana pola, głowica dalej działa jako suwak.
test.use({ reducedMotion: "reduce" });

test("every chapter word is visible at rest from the first frame under reduced motion", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __first?: { boot: string | null; opener: string | null; visible: number; total: number } };
    requestAnimationFrame(() => {
      const words = Array.from(document.querySelectorAll("[data-chapter] :is(h1, h2)[data-word]"));
      const visible = words.filter((el) => {
        const cs = getComputedStyle(el);
        return cs.visibility !== "hidden" && cs.opacity !== "0" && cs.transform === "none";
      }).length;
      w.__first = {
        boot: document.documentElement.getAttribute("data-motion-boot"),
        opener: document.documentElement.getAttribute("data-opener"),
        visible,
        total: words.length,
      };
    });
  });
  await page.goto("/");
  await page.waitForTimeout(600);
  const first = await page.evaluate(() => (window as unknown as { __first?: { boot: string | null; opener: string | null; visible: number; total: number } }).__first);
  expect(first, "first frame recorded").toBeTruthy();
  expect(first!.boot, "no boot gate under reduced motion").toBeNull();
  expect(first!.opener, "opener skipped").toBe("skip");
  expect(first!.total).toBe(8);
  expect(first!.visible, "all words visible at rest in frame 1").toBe(8);
  // Hero w spoczynku: bez splitu, litery nieprzekształcone, zdanie czytelne.
  await expect(page.locator('[data-chapter="hero"]')).toHaveAttribute("data-phase", "rest");
  expect(await page.locator('[data-chapter="hero"] .ch').count(), "no split at rest").toBe(0);
  await expect(page.locator("[data-opener-bars]")).toBeHidden();
});

test("the cut is an instant field change and the playhead still works as a slider", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(300);
  const position = page.locator('[data-chapter="position"]');
  await position.evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(400);
  await expect(page.locator("[data-cut]"), "no overlay under reduced motion").toBeHidden();
  await expect(page.locator("html")).toHaveAttribute("data-cut-state", "after");
  await expect(position).toHaveAttribute("data-phase", "rest");

  const slider = page.locator("[data-playhead]");
  await slider.focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", "4");
  await expect(slider).toHaveAttribute("aria-valuetext", /of \d:\d\d\.\d\d/);
  await expect(position).toHaveAttribute("data-phase", "intro");
  await slider.blur();
  await expect(position).toHaveAttribute("data-phase", "rest");
  await expect(slider).toHaveAttribute("aria-valuenow", "100");
});
