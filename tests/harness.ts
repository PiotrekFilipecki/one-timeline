import type { Page } from "@playwright/test";

// Harness przesunięć układu. Nagrywa boxy widocznych słów i linijek co klatkę, bez zaokrąglania.
// Box jest liczony WZGLĘDEM SEKCJI rozdziału (closest [data-chapter]) i bez translacji elementu ani jego
// przodków w sekcji (parallax stopki): transform nie zmienia układu, a przypięta sekcja (SCRUB) i treść
// smoothera poruszają się względem dokumentu z definicji.
// Liczą się tylko elementy w kadrze i widoczne (jak w CLS). Gotowy na hover/focus (snapshotBoxes + diffBoxes).

export const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920] as const;

export const TRACKED = "[data-word], [data-line]";

export type Box = [x: number, y: number, w: number, h: number];
export type Sample = { t: number; fonts: string; boot: string | null; boxes: Record<string, Box> };

type Win = Window & { __layout?: Sample[]; __layoutKey?: (el: Element) => string; __layoutBox?: (el: Element) => Box | null; __layoutStop?: () => void };

const keyScript = () => {
  const w = window as Win;
  w.__layoutBox = (el: Element) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.opacity === "0" || cs.display === "none") return null;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return null;
    const sectionEl = el.closest("[data-chapter]");
    const section = sectionEl?.getBoundingClientRect() ?? { x: 0, y: 0 };
    // Translacje własne i przodków aż do sekcji (parallax stopki, numer): transform nie zmienia układu.
    let dx = 0;
    let dy = 0;
    for (let node: Element | null = el; node && node !== sectionEl; node = node.parentElement) {
      const t = getComputedStyle(node).transform;
      if (t && t !== "none") {
        const m = new DOMMatrixReadOnly(t);
        dx += m.e;
        dy += m.f;
      }
    }
    return [r.x - dx - section.x, r.y - dy - section.y, r.width, r.height] as Box;
  };
  w.__layoutKey = (el: Element) => {
    const chapter = el.closest("[data-chapter]")?.getAttribute("data-chapter") ?? "page";
    const word = el.getAttribute("data-word");
    const line = el.getAttribute("data-line");
    const name = word != null ? `word:${word}` : `line:${line}`;
    const twins = Array.from(document.querySelectorAll(word != null ? `[data-word="${word}"]` : `[data-line="${line}"]`));
    return `${chapter}/${name}#${twins.indexOf(el)}`;
  };
};

const recorderScript = ({ selector, ms }: { selector: string; ms: number }) => {
  const w = window as Win;
  // Jeden rekorder naraz: poprzedni (jeszcze w oknie czasu) przestaje dopisywać do nowej listy próbek.
  w.__layoutStop?.();
  w.__layout = [];
  const t0 = performance.now();
  let stopped = false;
  w.__layoutStop = () => {
    stopped = true;
  };
  const tick = () => {
    const boxes: Record<string, Box> = {};
    for (const el of Array.from(document.querySelectorAll(selector))) {
      const box = w.__layoutBox!(el);
      if (box) boxes[w.__layoutKey!(el)] = box;
    }
    if (Object.keys(boxes).length) {
      w.__layout!.push({ t: performance.now() - t0, fonts: document.fonts.status, boot: document.documentElement.getAttribute("data-motion-boot"), boxes });
    }
    if (!stopped && performance.now() - t0 < ms) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

/** Wołaj przed goto. Nagrywa przez `ms` od pierwszej klatki. */
export async function installRecorder(page: Page, { selector = TRACKED, ms = 2500 } = {}): Promise<void> {
  await page.addInitScript(keyScript);
  await page.addInitScript(recorderScript, { selector, ms });
}

/** Nowe okno nagrywania na już załadowanej stronie (kolejne rozdziały, SCRUB). */
export async function record(page: Page, { selector = TRACKED, ms = 3000 } = {}): Promise<void> {
  await ensureKeys(page);
  await page.evaluate(recorderScript, { selector, ms });
}

export const readSamples = (page: Page): Promise<Sample[]> => page.evaluate(() => (window as Win).__layout ?? []);

/** Funkcje kluczy i boxów na stronie, gdy test nie instalował rekordera przed goto. */
const ensureKeys = async (page: Page): Promise<void> => {
  if (!(await page.evaluate(() => typeof (window as Win).__layoutBox === "function"))) await page.evaluate(keyScript);
};

/** Jednorazowy zrzut boxów (do hover/focus: zrzut przed, akcja, zrzut po). */
export const snapshotBoxes = async (page: Page, selector: string = TRACKED): Promise<Record<string, Box>> => {
  await ensureKeys(page);
  return page.evaluate((selector) => {
    const w = window as Win;
    const boxes: Record<string, Box> = {};
    for (const el of Array.from(document.querySelectorAll(selector))) {
      const box = w.__layoutBox!(el);
      if (box) boxes[w.__layoutKey!(el)] = box;
    }
    return boxes;
  }, selector);
};

/**
 * Klucze, które się przesunęły, z deltami. Bez zaokrąglania do pikseli. EPS = 0.01 px: poniżej jednostki
 * układu Chromium (1/64 px = 0.0156), więc żadne realne przesunięcie przez niego nie przejdzie; zjada tylko
 * szum z serializacji macierzy transformu (computed `matrix(...)` ma ~6 cyfr znaczących).
 */
const EPS = 0.01;

export function diffBoxes(a: Record<string, Box>, b: Record<string, Box>, { except = new Set<string>() } = {}): string[] {
  const out: string[] = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (except.has(k)) continue;
    const x = a[k];
    const y = b[k];
    // Element wszedł w kadr albo z niego wyszedł (scroll): to nie przesunięcie.
    if (!x || !y) continue;
    const d = x.map((v, i) => y[i] - v);
    if (d.some((v) => Math.abs(v) > EPS)) out.push(`${k}: Δ[${d.map((v) => v.toFixed(3)).join(", ")}]`);
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

/** Czeka, aż rozdział z kontrolerem stanie w spoczynku (`data-phase="rest"`), zamiast czekania na czas intro.
 *  Ściśle: przed hydracją atrybutu nie ma, więc brak fazy nie liczy się jako spoczynek. */
export const waitForRest = (page: Page, id: string, timeout = 15000): Promise<unknown> =>
  page.waitForFunction((id) => (document.querySelector(`[data-chapter="${id}"]`) as HTMLElement | null)?.dataset.phase === "rest", id, { timeout });

/** Czeka, aż rozdział zacznie grać (`data-phase="intro"`), np. po Replay albo tapnięciu słowa. */
export const waitForIntro = (page: Page, id: string, timeout = 5000): Promise<unknown> =>
  page.waitForFunction((id) => (document.querySelector(`[data-chapter="${id}"]`) as HTMLElement | null)?.dataset.phase === "intro", id, { timeout });

/** Wyzwala cięcie do rozdziału `id` (próg 80 %) i czeka, aż rozdział stanie w spoczynku. */
export async function cutTo(page: Page, id: string, { settle = 8000 } = {}): Promise<void> {
  // Pozycja w dokumencie przez rect: offsetTop przypiętej sekcji (pin-spacer) to 0.
  const top = await page.locator(`[data-chapter="${id}"]`).evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  const vh = page.viewportSize()!.height;
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top - vh * 0.75);
  // 10 s: cięcie trwa 0.6 s, ale przy 4 równoległych workerach klatki bywają rzadkie.
  await page.waitForFunction((id) => document.documentElement.getAttribute(`data-cut-${id}`) === "after", id, { timeout: 10000 });
  // Rozdziały bez kontrolera (SCRUB, COST, YOURS) nie mają fazy: po cięciu stoją od razu.
  await page
    .waitForFunction((id) => {
      const el = document.querySelector(`[data-chapter="${id}"]`) as HTMLElement | null;
      return !el || el.dataset.phase === undefined || el.dataset.phase === "rest";
    }, id, { timeout: settle })
    .catch(() => {});
}

/** Przewija przez przypięty zakres SCRUB kółkiem, krokami. */
export async function wheelThroughScrub(page: Page, steps = 24, delay = 50, fraction = 1): Promise<void> {
  const vh = page.viewportSize()!.height;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, Math.round((vh * fraction) / steps));
    await page.waitForTimeout(delay);
  }
}
