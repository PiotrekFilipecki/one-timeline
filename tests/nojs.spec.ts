import { expect, test } from "@playwright/test";
import { CHAPTERS } from "../src/lib/palette";
import { hexToCss } from "../src/lib/contrast";

// Bez JS: wszystkie 8 słów widoczne, każde w swoich 2 kolorach, żadnej bramki w HTML,
// UI zależne od JS (Replay, głowica, opener) niewidoczne.
test.use({ javaScriptEnabled: false });

test("all 8 chapter words are visible in their colors without JavaScript", async ({ page }) => {
  await page.goto("/");
  expect(await page.locator("html").getAttribute("data-motion-boot")).toBeNull();
  expect(await page.locator("html").getAttribute("data-js")).toBeNull();
  for (const c of CHAPTERS) {
    const field = page.locator(`[data-chapter="${c.id}"]`);
    const word = field.locator(":is(h1, h2)[data-word]").first();
    await expect(word, `${c.id} word`).toBeVisible();
    await expect(field, `${c.id} field is ${c.names.bg}`).toHaveCSS("background-color", hexToCss(c.bg));
    await expect(word, `${c.id} word is ${c.names.fg}`).toHaveCSS("color", hexToCss(c.fg));
    const line = field.locator('[data-line="line"]');
    await expect(line, `${c.id} line is body color`).toHaveCSS("color", hexToCss(c.body ?? c.fg));
  }
  expect(await page.locator("[data-chapter] :is(h1, h2)[data-word]").count()).toBe(8);
  // Hero: zdanie w całości, znaczniki z COPY.md, kropka na końcu.
  const sentence = await page.locator('[data-chapter="hero"] h1 .t').allTextContents();
  expect(sentence.join(" ").replace(/ \./, ".")).toBe("Sequence, overlap, ease, stagger, scrub, reverse.");
  await expect(page.locator('[data-chapter="hero"] sup').first()).toHaveText("0:00.00");
  await expect(page.locator("[data-replay]")).toBeHidden();
  await expect(page.locator("[data-playhead]")).toBeHidden();
  await expect(page.locator("[data-opener-bars]")).toBeHidden();
  await expect(page.locator("[data-cut]")).toBeHidden();
});
