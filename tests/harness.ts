import type { Page } from "@playwright/test";

// Harness przesunięć układu. Nagrywa bounding boxy widocznych słów i linijek co klatkę od pierwszego
// rAF, bez zaokrąglania. Elementy ukryte (visibility hidden / opacity 0) nie liczą się do przesunięć,
// tak jak w CLS. Gotowy na hover/focus (snapshotBoxes + diffBoxes) w kolejnych fazach.

export const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920] as const;

export const TRACKED = "[data-word], [data-line]";

export type Box = [x: number, y: number, w: number, h: number];
export type Sample = { t: number; fonts: string; boot: string | null; boxes: Record<string, Box> };

type Win = Window & { __layout?: Sample[]; __layoutKey?: (el: Element) => string };

/** Klucz elementu: rozdział / atrybut#indeks wśród rodzeństwa o tym samym atrybucie. */
const keyScript = () => {
  const w = window as Win;
  w.__layoutKey = (el: Element) => {
    const chapter = el.closest("[data-chapter]")?.getAttribute("data-chapter") ?? "page";
    const word = el.getAttribute("data-word");
    const line = el.getAttribute("data-line");
    const name = word != null ? `word:${word}` : `line:${line}`;
    const twins = Array.from(document.querySelectorAll(word != null ? `[data-word="${word}"]` : `[data-line="${line}"]`));
    return `${chapter}/${name}#${twins.indexOf(el)}`;
  };
};

/** Wołaj przed goto. Nagrywa przez `ms` od pierwszej klatki. */
export async function installRecorder(page: Page, { selector = TRACKED, ms = 2500 } = {}): Promise<void> {
  await page.addInitScript(keyScript);
  await page.addInitScript(
    ({ selector, ms }) => {
      const w = window as Win;
      w.__layout = [];
      const t0 = performance.now();
      const tick = () => {
        const boxes: Record<string, Box> = {};
        for (const el of Array.from(document.querySelectorAll(selector))) {
          const cs = getComputedStyle(el);
          if (cs.visibility === "hidden" || cs.opacity === "0" || cs.display === "none") continue;
          const r = el.getBoundingClientRect();
          boxes[w.__layoutKey!(el)] = [r.x + window.scrollX, r.y + window.scrollY, r.width, r.height];
        }
        if (Object.keys(boxes).length) {
          w.__layout!.push({
            t: performance.now() - t0,
            fonts: document.fonts.status,
            boot: document.documentElement.getAttribute("data-motion-boot"),
            boxes,
          });
        }
        if (performance.now() - t0 < ms) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    { selector, ms },
  );
}

export const readSamples = (page: Page): Promise<Sample[]> => page.evaluate(() => (window as Win).__layout ?? []);

/** Jednorazowy zrzut boxów (do hover/focus: zrzut przed, akcja, zrzut po). */
export const snapshotBoxes = (page: Page, selector: string = TRACKED): Promise<Record<string, Box>> =>
  page.evaluate((selector) => {
    const w = window as Win;
    const boxes: Record<string, Box> = {};
    for (const el of Array.from(document.querySelectorAll(selector))) {
      const r = el.getBoundingClientRect();
      boxes[w.__layoutKey!(el)] = [r.x + window.scrollX, r.y + window.scrollY, r.width, r.height];
    }
    return boxes;
  }, selector);

/** Klucze, które się przesunęły, z deltami. Tolerancja 0 px: bez zaokrąglania. */
export function diffBoxes(a: Record<string, Box>, b: Record<string, Box>, { except = new Set<string>() } = {}): string[] {
  const out: string[] = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (except.has(k)) continue;
    const x = a[k];
    const y = b[k];
    if (!x || !y) {
      out.push(`${k}: ${x ? "disappeared" : "appeared"}`);
      continue;
    }
    const d = x.map((v, i) => y[i] - v);
    if (d.some((v) => v !== 0)) out.push(`${k}: Δ[${d.map((v) => v.toFixed(3)).join(", ")}]`);
  }
  return out;
}

/** Wszystkie przesunięcia między kolejnymi próbkami. Pusta lista = 0 przesunięć. */
export function shifts(samples: Sample[]): string[] {
  const out: string[] = [];
  for (let i = 1; i < samples.length; i++) {
    for (const d of diffBoxes(samples[i - 1].boxes, samples[i].boxes)) out.push(`t=${samples[i].t.toFixed(0)}ms ${d}`);
  }
  return out;
}

export const noHorizontalScroll = (page: Page): Promise<{ scrollWidth: number; clientWidth: number }> =>
  page.evaluate(() => ({
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    clientWidth: document.documentElement.clientWidth,
  }));
