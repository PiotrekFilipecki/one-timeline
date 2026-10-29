import { expect, test } from "@playwright/test";
import { BLOB_SHAPES, CHAPTER_SHAPE } from "../src/lib/blob";
import { CHAPTERS } from "../src/lib/palette";
import { cutTo, waitForRest } from "./harness";

// Blob-bohater: SSR niesie kształt spoczynku rozdziału z rastrem; JS zaczyna od kropli i morfuje do kształtu
// rozdziału (MorphSVG), pattern wraca do stanu z serwera; krzywa EASE morfuje z przyciskami; reduced motion = SSR.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("ot-opened", "1");
    } catch {}
  });
});

/** Box ścieżki o danym `d` w tym samym SVG (jednostki viewBoxa), żeby porównywać kształty, nie stringi. */
const bbox = (page: import("@playwright/test").Page, chapter: string, d?: string) =>
  page.evaluate(
    ({ chapter, d }) => {
      const svg = document.querySelector(`[data-chapter="${chapter}"] [data-blob]`)!;
      const own = svg.querySelector("[data-blob-shape]") as SVGPathElement;
      const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
      probe.setAttribute("d", d ?? own.getAttribute("d")!);
      (svg.closest("svg") ?? svg).appendChild(probe);
      const b = probe.getBBox();
      probe.remove();
      return { x: b.x, y: b.y, w: b.width, h: b.height };
    },
    { chapter, d },
  );

const close = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }, eps = 2) =>
  Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps && Math.abs(a.w - b.w) < eps && Math.abs(a.h - b.h) < eps;

test("the server renders every chapter's blob at rest, filled with the dotted pattern", async ({ request }) => {
  const html = await (await request.get("/")).text();
  // React serializuje atrybut bez wartości jako "true".
  const shapes = [...html.matchAll(/data-blob-shape="[^"]*" d="([^"]+)"/g)].map((m) => m[1]);
  expect(shapes.length, "one blob per chapter (EASE: the ball inside the curve scene)").toBe(CHAPTERS.length);
  for (const c of CHAPTERS) expect(html, `${c.id} rest shape in HTML`).toContain(BLOB_SHAPES[CHAPTER_SHAPE[c.id]]);
  expect((html.match(/data-blob-pattern="[^"]*"/g) ?? []).length).toBe(CHAPTERS.length);
  // Krzywa spoczynku zaczyna się na dole (ease(0) = 0 → y = 340) i kończy na górze.
  expect(html).toMatch(/data-ease-curve="[^"]*" d="M0\.0,340\.0/);
});

test("POSITION: the blob waits as the drop, morphs into the ticket during the intro and the pattern returns to rest", async ({ page }) => {
  await page.goto("/");
  await waitForRest(page, "hero");
  // Intro zbudowane po fontach: fromTo z morphSVG renderuje kroplę od razu (rozdział jeszcze nie grał).
  await expect(page.locator('[data-chapter="position"]')).toHaveAttribute("data-phase", "start");
  const base = await bbox(page, "position", BLOB_SHAPES.base);
  const ticket = await bbox(page, "position", BLOB_SHAPES.ticket);
  expect(close(await bbox(page, "position"), base), "drop before the intro").toBe(true);
  await cutTo(page, "position");
  expect(close(await bbox(page, "position"), ticket), "ticket at rest").toBe(true);
  const pattern = page.locator('[data-chapter="position"] [data-blob-pattern]');
  await expect(pattern).toHaveAttribute("patternTransform", "rotate(30) scale(1)");
  await expect(page.locator('[data-chapter="position"] [data-blob-dot]')).toHaveAttribute("r", "2.4");
  // Bilet wylądował przy lewej krawędzi sceny: bez transformu po spoczynku.
  expect(await page.locator('[data-chapter="position"] [data-blob]').evaluate((el) => getComputedStyle(el).transform)).toBe("none");
});

test("EASE: the curve morphs with each button and the ball ends at the end of the curve", async ({ page }) => {
  await page.goto("/");
  await waitForRest(page, "hero");
  await cutTo(page, "ease");
  const curve = page.locator("[data-ease-curve]");
  const rest = await curve.getAttribute("d");
  await page.locator('[data-ease="back.out(1.7)"]').click();
  await page.waitForTimeout(1100);
  const back = await curve.getAttribute("d");
  expect(back).not.toBe(rest);
  // back.out przestrzeliwuje: najwyższy punkt krzywej nad linią końca (y < 60).
  const minY = Math.min(...[...back!.matchAll(/,(-?\d+(?:\.\d+)?)/g)].map((m) => Number(m[1])));
  expect(minY).toBeLessThan(55);
  const ball = await page.locator("[data-ease-ball]").evaluate((el) => el.getAttribute("transform") ?? "");
  expect(ball, "ball at the curve's end (x = 1000)").toMatch(/matrix\(1,0,0,1,1000,|translate\(1000/);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("every blob keeps the exact server shape, nothing morphs", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(600);
    for (const c of CHAPTERS) {
      const d = await page.locator(`[data-chapter="${c.id}"] [data-blob-shape]`).getAttribute("d");
      expect(d, c.id).toBe(BLOB_SHAPES[CHAPTER_SHAPE[c.id]]);
    }
  });
});
