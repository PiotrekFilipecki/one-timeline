import { expect, test } from "@playwright/test";
import { YOURS_DEFAULT, YOURS_LIMITS, clampValues, codeLine } from "../src/lib/yours";
import { formatTime } from "../src/motion/format";
import { copy, parseCopy } from "../src/lib/copy";
import { CHAPTERS } from "../src/lib/palette";

// Czyste funkcje bez przeglądarki (jak contrast.spec): wartości YOURS, znacznik czasu hero, parser COPY.md.

test.describe("clampValues (YOURS)", () => {
  test("empty input gives the defaults, x clamped into the stage", () => {
    expect(clampValues({}, 300)).toEqual(YOURS_DEFAULT);
    expect(clampValues({}, 50).x, "default x above maxX lands on maxX").toBe(50);
    expect(clampValues({}, 300, -20).x, "default x stays when inside [minX, maxX]").toBe(YOURS_DEFAULT.x);
  });

  test("numbers clamp to their limits and strings parse like form fields", () => {
    const v = clampValues({ x: "99999", rotation: "-900", duration: "12" }, 259, -40);
    expect(v.x).toBe(259);
    expect(v.rotation).toBe(YOURS_LIMITS.rotation[0]);
    expect(v.duration).toBe(YOURS_LIMITS.duration[1]);
    expect(clampValues({ x: -500 }, 259, -40).x, "asymmetric minX").toBe(-40);
    expect(clampValues({ x: "12.5", duration: 0.25 }, 259)).toMatchObject({ x: 12.5, duration: 0.25 });
  });

  test("garbage falls back to the defaults, unknown ease and position too", () => {
    const v = clampValues({ x: "abc", rotation: "", duration: NaN, ease: "bounce", position: "+=9" }, 259);
    expect(v).toEqual(YOURS_DEFAULT);
    expect(clampValues({ ease: "expo.out", position: "<0.1" }, 259)).toMatchObject({ ease: "expo.out", position: "<0.1" });
  });

  test("codeLine prints a tl.to() with every value in order", () => {
    expect(codeLine(YOURS_DEFAULT)).toBe('tl.to(".letter", { x: 120, rotation: 12, duration: 0.8, ease: "beat" }, "+=0")');
    expect(codeLine({ x: -40, rotation: 0, duration: 3, ease: "none", position: "-=0.3" })).toBe('tl.to(".letter", { x: -40, rotation: 0, duration: 3, ease: "none" }, "-=0.3")');
  });
});

test.describe("formatTime (hero marks)", () => {
  test("seconds with hundredths, minutes when needed", () => {
    expect(formatTime(0)).toBe("0:00.00");
    expect(formatTime(0.9)).toBe("0:00.90");
    expect(formatTime(3.1)).toBe("0:03.10");
    expect(formatTime(61.25)).toBe("1:01.25");
  });

  test("rounding carries into the second and never goes negative", () => {
    expect(formatTime(1.999)).toBe("0:02.00");
    expect(formatTime(59.996)).toBe("1:00.00");
    expect(formatTime(-5)).toBe("0:00.00");
  });
});

test.describe("parseCopy (COPY.md)", () => {
  const src = [
    "# One Timeline copy",
    "",
    "## hero",
    "title: Hero",
    "word: Sequence",
    "line: One timeline, six words.",
    "code: tl.to(a, { x: 1 })",
    "code: tl.to(b, { x: 2 }, \"<\")",
    "marks: 0:00.00, 0:00.90, 0:01.60",
    "replay: Replay",
    "",
    "## sources",
    "title: Sources",
    "link: GSAP docs | https://gsap.com/docs/v3/",
    "link: Anybody | https://fonts.google.com/specimen/Anybody",
    "colophon: Set in Anybody.",
  ].join("\n");

  test("sections, scalars, code lines, marks and links", () => {
    const out = parseCopy(src);
    expect(Object.keys(out)).toEqual(["hero", "sources"]);
    expect(out.hero).toMatchObject({ title: "Hero", word: "Sequence", line: "One timeline, six words.", replay: "Replay" });
    expect(out.hero.code).toEqual(["tl.to(a, { x: 1 })", 'tl.to(b, { x: 2 }, "<")']);
    expect(out.hero.marks).toEqual(["0:00.00", "0:00.90", "0:01.60"]);
    expect(out.sources.link).toEqual([
      { label: "GSAP docs", url: "https://gsap.com/docs/v3/" },
      { label: "Anybody", url: "https://fonts.google.com/specimen/Anybody" },
    ]);
    expect(out.sources.colophon).toBe("Set in Anybody.");
  });

  test("an unknown key fails the build instead of leaking into the page", () => {
    expect(() => parseCopy("## hero\ntitle: Hero\nsubtitle: nope\n")).toThrow(/unknown key "subtitle"/);
  });

  test("lines before the first section and comments are ignored", () => {
    const out = parseCopy("title: orphan\n# comment\n## ease\ntitle: Ease\n# another comment\nword: Ease\nline: Curve.\n");
    expect(Object.keys(out)).toEqual(["ease"]);
    expect(out.ease).toMatchObject({ title: "Ease", word: "Ease", line: "Curve." });
  });

  test("the real docs/COPY.md has every chapter with title, word and a line of at most 15 words", () => {
    for (const c of CHAPTERS) {
      const entry = copy(c.id);
      expect(entry.title, `${c.id} title`).not.toBe("");
      expect(entry.word, `${c.id} word`).not.toBe("");
      expect(entry.line.split(/\s+/).length, `${c.id} line words`).toBeLessThanOrEqual(15);
    }
    expect(copy("hero").marks?.length, "hero has one mark per word of the sentence").toBe(6);
    expect(copy("sources").link?.length ?? 0).toBeGreaterThan(0);
  });
});
