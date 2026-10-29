import { expect, test } from "@playwright/test";
import { JANK, chapter } from "../src/lib/palette";
import { hexToCss } from "../src/lib/contrast";
import { cutTo } from "./harness";

// COST: tryb transform mieści się w budżecie; wymuszony tryb layout (left/top + odczyt offsetLeft po każdym
// zapisie) przy spowolnionym CPU przekracza 17.5 ms i pole tnie się na czerwień w ciągu 2 s; powrót = mięta.
// Orbita tylko w kadrze; pauza zatrzymuje ruch, licznik dalej mierzy.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("ot-opened", "1");
    } catch {}
  });
});

// Pomiar P3 na M-serii Mac: przy 1× obie ścieżki mieszczą się w klatce (4 litery, flush layoutu ≈ 0.03 ms);
// przy 12× CPU (rząd taniego telefonu) left/top z odczytem pęka, transform nie. Test wymusza 12×.
test("forced left/top mode turns the field red within 2 s at 12× CPU slowdown; transform turns it back to mint", async ({ page, context }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await page.waitForTimeout(300);
  await cutTo(page, "cost");
  const cost = page.locator('[data-chapter="cost"]');
  await expect(cost).toHaveAttribute("data-cost-ready", "");
  await expect(cost).toHaveAttribute("data-cost-in-view", "true");
  await page.waitForTimeout(1200);
  const transformMs = Number(await cost.getAttribute("data-ms"));
  await expect(cost).toHaveCSS("background-color", hexToCss(chapter("cost").bg));
  expect(await cost.getAttribute("data-jank")).toBeNull();

  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 12 });
  await page.locator("[data-cost-mode]").click();
  await expect(page.locator("[data-cost-mode]")).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => cost.evaluate((el) => el.hasAttribute("data-jank")), { timeout: 2000 }).toBe(true);
  await expect(cost).toHaveCSS("background-color", hexToCss(JANK.bg));
  const layoutMs = Number(await cost.getAttribute("data-ms"));
  // Body znika w jank (kontrast 3.31 tylko display), słowo i liczba stoją.
  await expect(cost.locator('[data-line="line"]')).toBeHidden();
  await expect(cost.locator("[data-ms]")).toBeVisible();
  console.log(`transform ${transformMs} ms/frame → left/top @12× CPU ${layoutMs} ms/frame (jank)`);

  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await page.locator("[data-cost-mode]").click();
  await expect.poll(() => cost.evaluate((el) => el.hasAttribute("data-jank")), { timeout: 2000 }).toBe(false);
  await expect(cost).toHaveCSS("background-color", hexToCss(chapter("cost").bg));
  await expect(cost.locator('[data-line="line"]')).toBeVisible();

  // Pauza: litery stoją, licznik żyje.
  await page.locator("[data-cost-pause]").click();
  await expect(cost).toHaveAttribute("data-cost-paused", "true");
  const before = await cost.locator(".ch").first().evaluate((el) => el.style.transform);
  await page.waitForTimeout(400);
  const after = await cost.locator(".ch").first().evaluate((el) => el.style.transform);
  expect(after).toBe(before);
  // Poza kadrem: orbita stoi.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(cost).toHaveAttribute("data-cost-in-view", "false");
});
