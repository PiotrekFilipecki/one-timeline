# STATUS · One Timeline v7

**Faza:** P3 zakończona (29.10.2026). Bramki P1–P3 czekają na Piotrka; praca idzie dalej na jego życzenie. **Następna:** P4 (bramki jakości, telefon, przygotowanie do wdrożenia).

## Stan repo
- `main` wypchnięty na https://github.com/PiotrekFilipecki/one-timeline (prywatne; Piotrek zrobił `gh repo create --push` ręcznie, bo klasyfikator auto-mode blokował push).
- Lint 0 · tsc 0 · build 0 · `npm test` 36/36 (14 skipped = shots) · media: p0 16 PNG · p1 26 PNG + 2 webm · p2 46 PNG + 2 webm · p3 30 PNG + 2 webm (w tym pełne strony bez JS i z reduced motion).

## Co istnieje
- 8 plakatów (`src/chapters/*`), treść z `docs/COPY.md`, kolory z `src/lib/palette.ts` (inline na `[data-chapter]`).
- **P1:** opener (8 pasków), hero odgrywane słowo po słowie (`src/motion/hero.ts`), POSITION z dyptykiem i głowicą (`position.ts`, `playhead.ts`), hover szerokości (`hover.ts`), skok z wagą (`jump.ts`). Komponenty klienckie: `HeroMotion`, `PositionMotion`, `Playhead`.
- **P3:** COST (orbita transform vs left/top z odczytem layoutu, liczba ms, czerwień po budżecie; `cost.ts`), YOURS (edytowalna linijka `tl.to()`, `src/lib/yours.ts` + `yours.ts`), pętla do hero (koniec dokumentu, link „Back to the top"), źródła i kolofon (`Sources` w `Yours.tsx`), no-JS i reduced motion dla całej strony.
- **P2:** EASE onion skin (`ease.ts`, `src/lib/eases.ts`), STAGGER siatka 16×7 / 8×7 (`stagger.ts`), SCRUB przypięty na scrollu (`scrub.ts`), REVERSE z realnym `easeReverse` (`reverse.ts`), wszystkie cięcia w `cuts.ts` (koordynator, jedno koło, litera per rozdział), rejestr rozdziałów `stage.ts`. Komponenty: `EaseMotion`, `StaggerMotion`, `ScrubMotion`, `ReverseMotion`, `Cuts`.
- Anybody variable (wdth 50–150, wght 100–900) przez `next/font`, bramka fontów z deadline 2 s (`src/motion/boot.ts`, `MotionBoot`).
- Rdzeń ruchu `src/motion/`: `register` (beat / beat-exit), `reduced-motion`, `boot` (bramka + opener raz na sesję), `split` (box słowa trzyma szerokość, litery przypięte), `chapter` (prepare → start → intro → rest → outro → end; seek dla głowicy).
- Testy: `contrast`, `layout` (7 szerokości: hero, hover/focus, każdy rozdział, SCRUB w scrollu, COST przełączenie, YOURS Play; 0 przesunięć), `chain` (7 cięć), `ease`, `perf` (fps przy 4× CPU), `cost` (czerwień przy 12× CPU), `yours`, `loop`, `nojs`, `reduced`, `font`, `cut`, `playhead`, `opener`, `shots` + `shots-p1/p2/p3`.
- Dokumenty: `docs/adr/0001-architektura.md`, `docs/devlog/P0-fundament.md`, `CLAUDE.md`.

## Do decyzji Piotrka
- **Bramka P1 (telefon, 20 min):** „występ czy animacja?" Werdykt jednym zdaniem do `docs/devlog/P1-hero.md`, sekcja „Do oceny przez Piotrka" (cięcie, skok z wagą, głowica).
- **Bramka P2 (telefon):** przewinięcie hero → mięta bez zacięć; każdy rozdział zrozumiały bez podpisu. Uwaga na kontur duchów EASE (czy z daleka nie wygląda na trzeci kolor) i spacjowanie SCRUB w stanie wąskim.
- **Bramka P3:** cała strona od hero do pętli; bez JS i z reduced motion czytelna. COST: na Macu bez spowolnienia tryb left/top nie robi się czerwony (4 litery to 0.03 ms layoutu na zapis; devlog P3, decyzja 1); na telefonie do sprawdzenia.
- Bramka P0: `docs/media/p0/`, czy kolory szaleją tak, jak chciałeś; YOURS ma trzy farby zgodnie z MOTION.md.
- MOTION.md: ścieżka `beat` poprawiona w P0 (dopisany punkt kontrolny). Krzywe nie były strojone w P1.

## Otwarte propozycje (ADR / devlog)
- Geist Mono zamiast stosu systemowego dla kodu.
- `cacheComponents: false` dla prostoty (strona statyczna).
- Dyptyki na telefonie o ~1 vw większe.
