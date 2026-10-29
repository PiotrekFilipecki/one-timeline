import { expect, test } from "@playwright/test";
import { CHAPTERS } from "../src/lib/palette";
import { hexToCss } from "../src/lib/contrast";
import { waitForIntro, waitForRest } from "./harness";

// a11y-gate: ścieżka klawiaturą od góry do dołu (kolejność i widoczny focus w kolorze typografii), głowice jako
// slidery, przyciski z aria-pressed, formularz YOURS z etykietami, struktura nagłówków, dotyk bez zawieszonego hovera.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("ot-opened", "1");
    } catch {}
  });
});

test("headings, landmarks, sliders, pressed buttons and labelled fields", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(300);
  expect(await page.locator("h1").count(), "one h1").toBe(1);
  const levels = await page.locator("h1, h2, h3").evaluateAll((els) => els.map((e) => e.tagName));
  expect(levels[0]).toBe("H1");
  expect(levels.filter((l) => l === "H2").length, "one h2 per chapter after hero").toBe(7);
  expect(levels.includes("H3")).toBe(false);
  expect(await page.locator("main").count()).toBe(1);
  expect(await page.locator("footer").count()).toBe(1);
  for (const c of CHAPTERS) await expect(page.locator(`[data-chapter="${c.id}"]`)).toHaveAttribute("aria-label", /.+/);

  const sliders = page.locator('[role="slider"]');
  expect(await sliders.count()).toBe(5);
  for (const s of await sliders.all()) {
    await expect(s).toHaveAttribute("aria-label", /.+/);
    await expect(s).toHaveAttribute("aria-valuemin", "0");
    await expect(s).toHaveAttribute("aria-valuemax", "100");
    await expect(s).toHaveAttribute("tabindex", "0");
  }
  for (const b of await page.locator("[data-ease], [data-cost-mode], [data-cost-pause]").all()) await expect(b).toHaveAttribute("aria-pressed", /true|false/);
  // Każde pole YOURS ma etykietę (label owija input/select); status z aria-live.
  const fields = page.locator("[data-field]");
  for (const f of await fields.all()) expect(await f.evaluate((el) => !!el.closest("label")?.textContent?.trim())).toBe(true);
  await expect(page.locator("[data-yours-status]")).toHaveAttribute("aria-live", "polite");
  // Przyciski słów hero mają nazwy; bez JS są poza kolejką Tab (tabindex -1 w HTML), z JS wracają.
  for (const w of await page.locator("[data-word-key]").all()) {
    await expect(w).toHaveAttribute("aria-label", /Replay: .+/);
    await expect(w).toHaveAttribute("tabindex", "0");
  }
});

test("keyboard path from top to bottom: logical order and a visible focus in the chapter's typography color", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await waitForRest(page, "hero");
  const order: string[] = [];
  const problems: string[] = [];
  let lastChapterIdx = -1;
  const ids = ["hero", "position", "ease", "stagger", "scrub", "reverse", "cost", "yours", "sources"];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const chapter = el.closest("[data-chapter]")?.getAttribute("data-chapter") ?? (el.closest("[data-sources]") ? "sources" : "page");
      const field = el.closest("[data-chapter], [data-sources]") as HTMLElement | null;
      const fg = field ? getComputedStyle(field).getPropertyValue("--fg").trim() : "";
      // Widoczny focus: outline na elemencie albo na jego hairline (głowica) w kolorze --fg.
      const target = el.matches("[data-playhead]") ? (el.firstElementChild as HTMLElement) : el;
      const cs = getComputedStyle(target);
      const r = el.getBoundingClientRect();
      return {
        label: `${chapter}/${el.tagName.toLowerCase()}${el.getAttribute("data-field") ? "[" + el.getAttribute("data-field") + "]" : ""}${el.getAttribute("data-ease") ? "[" + el.getAttribute("data-ease") + "]" : ""}`,
        chapter,
        outlineWidth: parseFloat(cs.outlineWidth),
        outlineStyle: cs.outlineStyle,
        outlineColor: cs.outlineColor,
        fg,
        inView: r.bottom > 0 && r.top < innerHeight && r.width > 0,
      };
    });
    if (!info) break;
    order.push(info.label);
    const idx = ids.indexOf(info.chapter);
    if (idx < lastChapterIdx) problems.push(`order: ${info.label} after chapter ${ids[lastChapterIdx]}`);
    lastChapterIdx = Math.max(lastChapterIdx, idx);
    if (!(info.outlineWidth >= 2 && info.outlineStyle !== "none")) problems.push(`focus not visible: ${info.label} (${info.outlineStyle} ${info.outlineWidth}px)`);
    else if (info.fg && info.outlineColor !== hexToCss(info.fg)) problems.push(`focus color: ${info.label} ${info.outlineColor} ≠ ${info.fg}`);
    if (!info.inView) problems.push(`focused element scrolled out of view: ${info.label}`);
  }
  console.log(`tab order (${order.length}): ${order.join(" → ")}`);
  expect(order.length).toBeGreaterThan(25);
  expect(order[order.length - 1]).toBe("sources/a");
  expect(problems, problems.join("\n")).toEqual([]);
});

test("touch never leaves a stuck hover on a hero word", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem("ot-opened", "1");
    } catch {}
  });
  const page = await context.newPage();
  await page.goto("/");
  await waitForRest(page, "hero");
  const word = page.locator('[data-word-key="ease"]');
  const type = word.locator(".t");
  const restStretch = await type.evaluate((el) => getComputedStyle(el).fontStretch);
  await word.tap();
  // Replay zdania zagrał (tap = klik) i stanął; szerokość słowa nie została „zawieszona" przez hover.
  await waitForIntro(page, "hero");
  await waitForRest(page, "hero");
  await expect(page.locator('[data-chapter="hero"]')).toHaveAttribute("data-phase", "rest");
  expect(await type.evaluate((el) => getComputedStyle(el).fontStretch)).toBe(restStretch);
  expect(await word.evaluate((el) => el.style.width)).toBe("");
  await context.close();
});
