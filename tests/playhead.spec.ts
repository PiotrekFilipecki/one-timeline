import { expect, test } from "@playwright/test";
import { cutTo } from "./harness";

// Głowica POSITION z klawiatury: role=slider, strzałki, Home/End, aria-valuetext z czasem,
// seek trzyma rozdział w intro; blur = powrót do spoczynku.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("ot-opened", "1");
    } catch {}
  });
});

test("the playhead is a keyboard slider that scrubs the chapter and releases to rest", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(300);
  const position = page.locator('[data-chapter="position"]');
  // scrollIntoView przewijałoby wrapper smoothera, nie okno: skok jak w harnessie.
  await cutTo(page, "position");
  await expect(page.locator("html")).toHaveAttribute("data-cut-position", "after");
  await expect(position).toHaveAttribute("data-phase", "rest");

  const slider = page.locator('[data-chapter="position"] [data-playhead]');
  await expect(slider).toHaveAttribute("role", "slider");
  await slider.focus();
  await expect(slider).toBeFocused();
  await page.keyboard.press("Home");
  await expect(slider).toHaveAttribute("aria-valuenow", "0");
  await expect(position).toHaveAttribute("data-phase", "intro");
  const atStart = await position.locator('[data-word="sequence"] .ch').first().evaluate((el) => getComputedStyle(el).transform);
  for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", "20");
  await expect(slider).toHaveAttribute("aria-valuetext", /^0:00\.\d\d of 0:0\d\.\d\d$/);
  await page.keyboard.press("End");
  await expect(slider).toHaveAttribute("aria-valuenow", "100");
  await page.keyboard.press("ArrowLeft");
  await expect(slider).toHaveAttribute("aria-valuenow", "98");
  const mid = await position.locator('[data-word="sequence"] .ch').first().evaluate((el) => getComputedStyle(el).transform);
  console.log(`first letter transform at 0 %: ${atStart}; at 98 %: ${mid}`);
  await slider.blur();
  await expect(position).toHaveAttribute("data-phase", "rest");
  expect(await position.locator(".ch").count(), "split reverted at rest").toBe(0);
});
