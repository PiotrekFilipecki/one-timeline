# STATUS · One Timeline v7

**Faza:** P1 zakończona (29.10.2026), czeka na bramkę kierunku Piotrka (telefon, 20 min). **Następna:** P2 (EASE, STAGGER, SCRUB, REVERSE), prowadzona dalej bez zatrzymania na życzenie Piotrka.

## Stan repo
- `main` wypchnięty na https://github.com/PiotrekFilipecki/one-timeline (prywatne; Piotrek zrobił `gh repo create --push` ręcznie, bo klasyfikator auto-mode blokował push).
- Lint 0 · tsc 0 · build 0 · `npm test` 26/26 (6 skipped = shots) · `docs/media/p0/` 16 PNG · `docs/media/p1/` 26 PNG + 2 webm.

## Co istnieje
- 8 plakatów (`src/chapters/*`), treść z `docs/COPY.md`, kolory z `src/lib/palette.ts` (inline na `[data-chapter]`).
- **P1:** opener (8 pasków), hero odgrywane słowo po słowie (`src/motion/hero.ts`), POSITION z dyptykiem i głowicą (`position.ts`, `playhead.ts`), cięcie hero → POSITION przez kropkę (`cut.ts`), hover szerokości (`hover.ts`), skok z wagą (`jump.ts`). Komponenty klienckie: `HeroMotion`, `PositionMotion`, `Playhead`.
- Anybody variable (wdth 50–150, wght 100–900) przez `next/font`, bramka fontów z deadline 2 s (`src/motion/boot.ts`, `MotionBoot`).
- Rdzeń ruchu `src/motion/`: `register` (beat / beat-exit), `reduced-motion`, `boot` (bramka + opener raz na sesję), `split` (box słowa trzyma szerokość, litery przypięte), `chapter` (prepare → start → intro → rest → outro → end; seek dla głowicy).
- Testy: `contrast`, `layout` (7 szerokości, intro + hover/focus, 0 przesunięć), `nojs`, `reduced`, `font`, `cut`, `playhead`, `opener`, `shots` + `shots-p1` (`npm run shots <faza>`).
- Dokumenty: `docs/adr/0001-architektura.md`, `docs/devlog/P0-fundament.md`, `CLAUDE.md`.

## Do decyzji Piotrka
- **Bramka P1 (telefon, 20 min):** „występ czy animacja?" Werdykt jednym zdaniem do `docs/devlog/P1-hero.md`, sekcja „Do oceny przez Piotrka" (cięcie, skok z wagą, głowica).
- Bramka P0: `docs/media/p0/`, czy kolory szaleją tak, jak chciałeś; YOURS ma trzy farby zgodnie z MOTION.md.
- MOTION.md: ścieżka `beat` poprawiona w P0 (dopisany punkt kontrolny). Krzywe nie były strojone w P1.

## Otwarte propozycje (ADR / devlog)
- Geist Mono zamiast stosu systemowego dla kodu.
- `cacheComponents: false` dla prostoty (strona statyczna).
- Dyptyki na telefonie o ~1 vw większe.
