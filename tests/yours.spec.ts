import { expect, test } from "@playwright/test";
import { cutTo } from "./harness";

// YOURS: pola walidowane i ograniczone (x w kadrze, duration 0.1–3, ease i position z listy), linijka kodu
// odzwierciedla wartości, Play gra na literach, Reverse cofa, Copy kopiuje; reduced motion: Play = stan końcowy.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("ot-opened", "1");
    } catch {}
  });
});

test("fields clamp, the code line follows, Play animates the letters and Reverse brings them back", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await page.waitForTimeout(300);
  await cutTo(page, "yours");
  const yours = page.locator('[data-chapter="yours"]');
  const line = yours.locator("[data-yours-line]");
  await expect(line).toHaveText('tl.to(".letter", { x: 120, rotation: 12, duration: 0.8, ease: "beat" }, "+=0")');

  const x = yours.locator('[data-field="x"]');
  await x.fill("99999");
  await x.dispatchEvent("change");
  const maxX = Number(await x.getAttribute("max"));
  expect(maxX).toBeGreaterThan(0);
  await expect(x).toHaveValue(String(maxX));
  await expect(line).toContainText(`x: ${maxX},`);

  const duration = yours.locator('[data-field="duration"]');
  await duration.fill("12");
  await duration.dispatchEvent("change");
  await expect(duration).toHaveValue("3");
  // Niepoprawna wartość (input number nie przyjmuje liter, więc pusto) → wraca do domyślnej.
  await duration.fill("");
  await duration.dispatchEvent("change");
  await expect(duration).toHaveValue("0.8");

  await yours.locator('[data-field="position"]').selectOption("<0.1");
  await yours.locator('[data-field="ease"]').selectOption("expo.out");
  await expect(line).toHaveText(`tl.to(".letter", { x: ${maxX}, rotation: 12, duration: 0.8, ease: "expo.out" }, "<0.1")`);

  await yours.locator("[data-yours-play]").click();
  await expect(yours).toHaveAttribute("data-yours-state", "end", { timeout: 5000 });
  const dur = Number(await yours.getAttribute("data-yours-duration"));
  // 5 liter, "<0.1": start co 0.1 s, każda 0.8 s → 1.2 s.
  expect(dur).toBeCloseTo(1.2, 1);
  // Macierz czytana w przeglądarce (DOMMatrixReadOnly nie istnieje w Node).
  const moved = await yours.locator(".ch").last().evaluate((el) => {
    const t = getComputedStyle(el).transform;
    const m = new DOMMatrixReadOnly(t === "none" ? "" : t);
    return Math.hypot(m.e, m.f);
  });
  expect(Math.round(moved)).toBeGreaterThan(0);
  // Ostatnia litera w kadrze.
  const inFrame = await yours.locator(".ch").last().evaluate((el) => el.getBoundingClientRect().right <= innerWidth + 1);
  expect(inFrame).toBe(true);

  await yours.locator("[data-yours-reverse]").click();
  await expect(yours).toHaveAttribute("data-yours-state", "start", { timeout: 5000 });
  const back = await yours.locator(".ch").last().evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).e);
  expect(Math.abs(back)).toBeLessThan(0.5);

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await yours.locator("[data-yours-copy]").click();
  await expect(yours.locator("[data-yours-status]")).toHaveText("Copied.");
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toBe(await line.textContent());
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("Play sets the end state at once", async ({ page }) => {
    await page.goto("/");
    const yours = page.locator('[data-chapter="yours"]');
    await yours.evaluate((el) => el.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(300);
    await yours.locator("[data-yours-play]").click();
    await expect(yours).toHaveAttribute("data-yours-state", "end");
    const e = await yours.locator(".ch").first().evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).e);
    expect(Math.round(e)).toBe(120);
  });
});
