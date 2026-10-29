import { expect, test } from "@playwright/test";
import { cutTo, diffBoxes, snapshotBoxes } from "./harness";

// Q1: hover i focus każdego interaktywnego elementu w każdym rozdziale: boxy słów i linijek nie ruszają się.
// Na 1440 i 390 (pełne 7 szerokości dla hero jest w layout.spec).

for (const vp of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`${vp.width}px: hover and focus of every control keep the layout still`, async ({ browser }) => {
    test.setTimeout(150_000);
    const context = await browser.newContext({ viewport: vp });
    await context.addInitScript(() => {
      try {
        sessionStorage.setItem("ot-opened", "1");
      } catch {}
    });
    const page = await context.newPage();
    await page.goto("/");
    await page.waitForTimeout(6500);
    const report: string[] = [];
    for (const id of ["hero", "position", "ease", "stagger", "scrub", "reverse", "cost", "yours"] as const) {
      if (id !== "hero") await cutTo(page, id);
      await page.waitForTimeout(300);
      const scope = `[data-chapter="${id}"]`;
      const controls = page.locator(`${scope} :is(button, a, input, select, [role="slider"]):visible`);
      const n = await controls.count();
      const rest = await snapshotBoxes(page);
      for (let i = 0; i < n; i++) {
        const c = controls.nth(i);
        const label = await c.evaluate((el) => `${el.tagName.toLowerCase()}${el.getAttribute("data-field") ? "[" + el.getAttribute("data-field") + "]" : ""}`);
        await c.hover();
        await page.waitForTimeout(300);
        expect(diffBoxes(rest, await snapshotBoxes(page)), `${id}: hover ${label} #${i} at ${vp.width}px`).toEqual([]);
        await page.mouse.move(0, 0);
        await c.focus();
        await page.waitForTimeout(300);
        expect(diffBoxes(rest, await snapshotBoxes(page)), `${id}: focus ${label} #${i} at ${vp.width}px`).toEqual([]);
        await c.blur();
        await page.waitForTimeout(400);
      }
      report.push(`${id}: ${n} controls`);
    }
    console.log(`${vp.width}px: ${report.join(", ")}: 0 shifts`);
    await context.close();
  });
}
