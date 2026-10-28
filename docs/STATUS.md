# STATUS · One Timeline v7

**Faza:** P0 zakończona (28.10.2026). **Następna:** P1 (hero, opener, POSITION, cięcie, głowica; bramka kierunku).

## Stan repo
- `main`, 3 commity lokalnie. **Nie wypchnięte**: `gh repo create one-timeline --private --source=. --push` zablokował klasyfikator auto-mode; zrób to ręcznie.
- Lint 0 · tsc 0 · build 0 · `npm test` 21/21 (2 skipped = shots) · `npm run shots p0` = 16 PNG w `docs/media/p0/`.

## Co istnieje
- 8 statycznych plakatów (`src/chapters/*`), treść z `docs/COPY.md`, kolory z `src/lib/palette.ts` (inline na `[data-chapter]`).
- Anybody variable (wdth 50–150, wght 100–900) przez `next/font`, bramka fontów z deadline 2 s (`src/motion/boot.ts`, `MotionBoot`).
- Rdzeń ruchu `src/motion/`: `register` (beat / beat-exit), `reduced-motion`, `boot`, `split` (przypięte szerokości), `chapter` (kontroler cyklu życia, bez klienta w P0).
- Testy: `contrast`, `layout` (7 szerokości, 0 przesunięć), `nojs`, `reduced`, `font`, `shots` (`npm run shots <faza>`). Harness w `tests/harness.ts` gotowy na hover/focus.
- Dokumenty: `docs/adr/0001-architektura.md`, `docs/devlog/P0-fundament.md`, `CLAUDE.md`.

## Do decyzji Piotrka (bramka P0, 5 min)
- `docs/media/p0/`: czy kolory szaleją tak, jak chciałeś; czy YOURS z trzema farbami (zieleń / róż / mięta, zgodnie z MOTION.md) gra.
- MOTION.md: ścieżka `beat` poprawiona (dopisany punkt kontrolny, bo CustomEase rzucał). Jeśli chcesz inny kształt osiadania, P1 stroi na żywo.

## Otwarte propozycje (ADR / devlog)
- Geist Mono zamiast stosu systemowego dla kodu.
- `cacheComponents: false` dla prostoty (strona statyczna).
- Dyptyki na telefonie o ~1 vw większe.
