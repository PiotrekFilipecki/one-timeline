import { expect, test } from "@playwright/test";
import { gsap } from "gsap";
import { EASE_COPIES, EASE_NAMES, EASE_REST } from "../src/lib/eases";
import { cutTo } from "./harness";

// EASE: pozycja kopii i = parseEase(e)(i/11) × przebieg, tolerancja 1 px. W spoczynku (CSS, bez GSAP) układ
// expo.out; po przycisku każdy z czterech układów. Przyciski mówią, który easing gra (aria-pressed).

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("ot-opened", "1");
    } catch {}
  });
});

const positions = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const onion = document.querySelector("[data-onion]")!;
    const copies = Array.from(onion.children) as HTMLElement[];
    const base = onion.getBoundingClientRect().left;
    const w = copies[0].getBoundingClientRect().width;
    const travel = onion.getBoundingClientRect().width - w;
    return { xs: copies.map((c) => c.getBoundingClientRect().left - base), travel };
  });

test("copies sit on the ease curve: at rest (expo.out, CSS only) and after each button", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(300);
  const check = async (name: string, label: string) => {
    const { xs, travel } = await positions(page);
    expect(xs.length).toBe(EASE_COPIES);
    const fn = gsap.parseEase(name);
    const worst = Math.max(...xs.map((x, i) => Math.abs(x - fn(i / (EASE_COPIES - 1)) * travel)));
    console.log(`${label}: travel ${travel.toFixed(1)} px, worst deviation ${worst.toFixed(3)} px`);
    expect(worst, `${label} vs gsap.parseEase("${name}")`).toBeLessThanOrEqual(1);
  };
  // Spoczynek bez JS-owego układu: zanim cięcie zagra EASE, kopie stoją z CSS (--p).
  await check(EASE_REST, "rest (CSS)");
  await cutTo(page, "ease");
  await check(EASE_REST, "after intro");
  for (const name of EASE_NAMES) {
    await page.locator(`[data-ease="${name}"]`).click();
    await page.waitForTimeout(900);
    await expect(page.locator(`[data-ease="${name}"]`)).toHaveAttribute("aria-pressed", "true");
    await check(name, `button ${name}`);
  }
});
