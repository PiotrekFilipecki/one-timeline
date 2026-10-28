import { expect, test } from "@playwright/test";
import { CHAPTERS, JANK } from "../src/lib/palette";
import { contrast } from "../src/lib/contrast";

// Kontrast WCAG każdej pary z palette.ts, liczony wzorem. Display ≥ 3.0, body ≥ 4.5.

test("formula sanity: black on white is 21:1, white on white is 1:1", () => {
  expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
  expect(contrast("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
});

for (const c of CHAPTERS) {
  test(`${c.id}: display ${c.names.fg} on ${c.names.bg} ≥ 3.0 and body ≥ 4.5`, () => {
    const display = contrast(c.fg, c.bg);
    console.log(`${c.id.padEnd(9)} display ${c.fg} on ${c.bg} = ${display.toFixed(2)}${c.body ? `  body ${c.body} = ${contrast(c.body, c.bg).toFixed(2)}` : ""}`);
    expect(display, `${c.id} display`).toBeGreaterThanOrEqual(3.0);
    if (c.body) expect(contrast(c.body, c.bg), `${c.id} body`).toBeGreaterThanOrEqual(4.5);
  });
}

test("cost (jank): display on red ≥ 3.0, no body in that state", () => {
  const display = contrast(JANK.fg, JANK.bg);
  console.log(`jank      display ${JANK.fg} on ${JANK.bg} = ${display.toFixed(2)}`);
  expect(display).toBeGreaterThanOrEqual(3.0);
  expect(JANK.body).toBeUndefined();
});

test("chain: typography of chapter N is the field of chapter N+1, and YOURS loops to hero", () => {
  for (let i = 0; i < CHAPTERS.length - 1; i++) {
    expect(CHAPTERS[i + 1].bg, `${CHAPTERS[i].id} → ${CHAPTERS[i + 1].id}`).toBe(CHAPTERS[i].fg);
  }
  expect(CHAPTERS[CHAPTERS.length - 1].fg).toBe(CHAPTERS[0].bg);
});
