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
        // EASE ma transform w spoczynku (CSS, układ expo.out); reszta słów stoi bez transformu.
        const ease = el.closest('[data-chapter="ease"]');
        return cs.visibility !== "hidden" && cs.opacity !== "0" && (ease || cs.transform === "none");
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
  await expect(page.locator("html")).toHaveAttribute("data-cut-position", "after");
  await expect(position).toHaveAttribute("data-phase", "rest");

  const slider = page.locator('[data-chapter="position"] [data-playhead]');
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

test("P2 chapters rest without motion: EASE expo.out layout, STAGGER full word, SCRUB middle axes, REVERSE both rows", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(300);
  for (const id of ["ease", "stagger", "scrub", "reverse"]) {
    await page.locator(`[data-chapter="${id}"]`).evaluate((el) => el.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(300);
  }
  const copies = await page.locator("[data-onion] > *").count();
  expect(copies).toBe(12);
  await expect(page.locator('[data-chapter="ease"]')).toHaveAttribute("data-phase", "rest");
  const visibleCells = await page.locator("[data-cell]").evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== "none" && getComputedStyle(e).transform === "none").length);
  expect(visibleCells).toBeGreaterThanOrEqual(56);
  expect(await page.locator('[data-chapter="scrub"]').getAttribute("data-scrub-ready"), "no pin under reduced motion").toBeNull();
  const scrub = await page.locator('[data-chapter="scrub"] [data-word="scrub"]').evaluate((el) => ({ stretch: getComputedStyle(el).fontStretch, weight: getComputedStyle(el).fontWeight, chars: el.querySelectorAll(".ch").length }));
  expect(scrub).toEqual({ stretch: "100%", weight: "500", chars: 0 });
  await expect(page.locator('[data-chapter="reverse"]')).toHaveAttribute("data-phase", "rest");
  expect(await page.locator('[data-chapter="reverse"] .ch').count()).toBe(0);
  // COST: bez orbit, liczba to pomiar spoczynkowy.
  const cost = page.locator('[data-chapter="cost"]');
  await cost.evaluate((el) => el.scrollIntoView({ block: "start" }));
  await expect(cost).toHaveAttribute("data-cost-ready", "");
  await page.waitForTimeout(600);
  expect(await cost.locator(".ch").count(), "no split, no orbit").toBe(0);
  const ms = Number(await cost.getAttribute("data-ms"));
  expect(ms).toBeGreaterThan(0);
  expect(await cost.getAttribute("data-jank")).toBeNull();
});
