import { expect, test } from "@playwright/test";

// Reduced motion: żadnej bramki, wszystkie słowa w stanie spoczynku od pierwszej klatki.
test.use({ reducedMotion: "reduce" });

test("every chapter word is visible at rest from the first frame under reduced motion", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __first?: { boot: string | null; visible: number; total: number } };
    requestAnimationFrame(() => {
      const words = Array.from(document.querySelectorAll("[data-chapter] :is(h1, h2)[data-word]"));
      const visible = words.filter((el) => {
        const cs = getComputedStyle(el);
        return cs.visibility !== "hidden" && cs.opacity !== "0" && cs.transform === "none";
      }).length;
      w.__first = { boot: document.documentElement.getAttribute("data-motion-boot"), visible, total: words.length };
    });
  });
  await page.goto("/");
  await page.waitForTimeout(300);
  const first = await page.evaluate(() => (window as unknown as { __first?: { boot: string | null; visible: number; total: number } }).__first);
  expect(first, "first frame recorded").toBeTruthy();
  expect(first!.boot, "no boot gate under reduced motion").toBeNull();
  expect(first!.total).toBe(8);
  expect(first!.visible, "all words visible at rest in frame 1").toBe(8);
});
