import { expect, test } from "@playwright/test";

// Z3: ładuje się plik variable Anybody, a "wdth" 50 i 150 realnie zmieniają szerokość słowa.
test("Anybody loads as one variable face and the wdth axis changes word width", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    await document.fonts.ready;
    const faces = Array.from(document.fonts).filter((f) => /anybody/i.test(f.family) && !/fallback/i.test(f.family));
    const loaded = faces.filter((f) => f.status === "loaded").map((f) => ({ family: f.family, weight: f.weight, stretch: f.stretch, status: f.status }));
    const probe = document.createElement("span");
    probe.textContent = "STAGGER";
    Object.assign(probe.style, {
      position: "absolute",
      visibility: "hidden",
      whiteSpace: "nowrap",
      fontFamily: getComputedStyle(document.body).fontFamily,
      fontSize: "100px",
      fontWeight: "800",
      textTransform: "uppercase",
    });
    document.body.append(probe);
    const widthAt = (wdth: number) => {
      probe.style.fontVariationSettings = `"wdth" ${wdth}`;
      return probe.getBoundingClientRect().width;
    };
    const widths = { wdth50: widthAt(50), wdth100: widthAt(100), wdth150: widthAt(150) };
    const fallbackWidth = (() => {
      probe.style.fontFamily = "Arial";
      probe.style.fontVariationSettings = "normal";
      return probe.getBoundingClientRect().width;
    })();
    probe.remove();
    return { loaded, widths, fallbackWidth, fontFamily: getComputedStyle(document.body).fontFamily };
  });
  console.log(JSON.stringify(result, null, 2));
  expect(result.loaded.length, "a loaded Anybody face").toBeGreaterThan(0);
  const variable = result.loaded.find((f) => /\d+\s+\d+/.test(f.weight));
  expect(variable, "weight range like \"100 900\" proves the variable file").toBeTruthy();
  expect(result.widths.wdth50).toBeLessThan(result.widths.wdth100);
  expect(result.widths.wdth100).toBeLessThan(result.widths.wdth150);
  expect(result.widths.wdth150 / result.widths.wdth50).toBeGreaterThan(1.5);
});
