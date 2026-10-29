# STATUS · One Timeline v7

**Faza:** P2 zakończona (29.10.2026). Bramki P1 (kierunek) i P2 (hero → mięta na telefonie) czekają na Piotrka; praca idzie dalej na jego życzenie. **Następna:** P3 (COST, YOURS, pętla, no-JS, reduced motion, kolofon).

## Stan repo
- `main` wypchnięty na https://github.com/PiotrekFilipecki/one-timeline (prywatne; Piotrek zrobił `gh repo create --push` ręcznie, bo klasyfikator auto-mode blokował push).
- Lint 0 · tsc 0 · build 0 · `npm test` 31/31 (10 skipped = shots) · `docs/media/p0/` 16 PNG · `docs/media/p1/` 26 PNG + 2 webm · `docs/media/p2/` 46 PNG + 2 webm.

## Co istnieje
- 8 plakatów (`src/chapters/*`), treść z `docs/COPY.md`, kolory z `src/lib/palette.ts` (inline na `[data-chapter]`).
- **P1:** opener (8 pasków), hero odgrywane słowo po słowie (`src/motion/hero.ts`), POSITION z dyptykiem i głowicą (`position.ts`, `playhead.ts`), hover szerokości (`hover.ts`), skok z wagą (`jump.ts`). Komponenty klienckie: `HeroMotion`, `PositionMotion`, `Playhead`.
- **P2:** EASE onion skin (`ease.ts`, `src/lib/eases.ts`), STAGGER siatka 16×7 / 8×7 (`stagger.ts`), SCRUB przypięty na scrollu (`scrub.ts`), REVERSE z realnym `easeReverse` (`reverse.ts`), wszystkie cięcia w `cuts.ts` (koordynator, jedno koło, litera per rozdział), rejestr rozdziałów `stage.ts`. Komponenty: `EaseMotion`, `StaggerMotion`, `ScrubMotion`, `ReverseMotion`, `Cuts`.
- Anybody variable (wdth 50–150, wght 100–900) przez `next/font`, bramka fontów z deadline 2 s (`src/motion/boot.ts`, `MotionBoot`).
- Rdzeń ruchu `src/motion/`: `register` (beat / beat-exit), `reduced-motion`, `boot` (bramka + opener raz na sesję), `split` (box słowa trzyma szerokość, litery przypięte), `chapter` (prepare → start → intro → rest → outro → end; seek dla głowicy).
- Testy: `contrast`, `layout` (7 szerokości: hero, hover/focus, każdy rozdział w intro, SCRUB w trakcie scrolla; 0 przesunięć), `chain` (łańcuch kolorów przez cięcia), `ease` (pozycje vs parseEase), `perf` (fps przy 4× CPU), `nojs`, `reduced`, `font`, `cut`, `playhead`, `opener`, `shots` + `shots-p1` + `shots-p2`.
- Dokumenty: `docs/adr/0001-architektura.md`, `docs/devlog/P0-fundament.md`, `CLAUDE.md`.

## Do decyzji Piotrka
- **Bramka P1 (telefon, 20 min):** „występ czy animacja?" Werdykt jednym zdaniem do `docs/devlog/P1-hero.md`, sekcja „Do oceny przez Piotrka" (cięcie, skok z wagą, głowica).
- **Bramka P2 (telefon):** przewinięcie hero → mięta bez zacięć; każdy rozdział zrozumiały bez podpisu. Uwaga na kontur duchów EASE (czy z daleka nie wygląda na trzeci kolor) i spacjowanie SCRUB w stanie wąskim.
- Bramka P0: `docs/media/p0/`, czy kolory szaleją tak, jak chciałeś; YOURS ma trzy farby zgodnie z MOTION.md.
- MOTION.md: ścieżka `beat` poprawiona w P0 (dopisany punkt kontrolny). Krzywe nie były strojone w P1.

## Otwarte propozycje (ADR / devlog)
- Geist Mono zamiast stosu systemowego dla kodu.
- `cacheComponents: false` dla prostoty (strona statyczna).
- Dyptyki na telefonie o ~1 vw większe.
