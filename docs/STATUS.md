# STATUS · One Timeline v7

**Faza:** v7.1 gotowe do oceny (29.10.2026, wieczór). Trzy PR-y czekają na merge Piotrka, w kolejności: [#1](https://github.com/PiotrekFilipecki/one-timeline/pull/1) `v7.1/scroll-grain-grid` (ScrollSmoother, ziarno, siatka, copy, favicon, stopka z socialami, SEO) → [#2](https://github.com/PiotrekFilipecki/one-timeline/pull/2) `v7.1/blob` (blob-bohater z rastrem, DrawSVG / MorphSVG / MotionPath w każdym rozdziale) → [#3](https://github.com/PiotrekFilipecki/one-timeline/pull/3) `v7.1/polish` (stopka gra ze słowem, nagrania, FINGERPRINT, Exit Check 13/13). Klasyfikator auto-mode blokuje `gh pr merge`. Devlogi: `docs/devlog/P5a…P5c`. Produkcja (`one-timeline.vercel.app`) do merge PR 1 pokazuje v7.

## Gotowość do wdrożenia
- Build statyczny (`next build`, trasa `/` prerenderowana), zero env, zero backendu. Vercel: `vercel --prod`. VPS: `npm run build && npm run start -p 3000` za reverse proxy. Decyzja: Piotrek.
- Raport bramek: `docs/devlog/P4-bramki.md` (układ 0 przesunięć, FCP 120 ms, CLS 0, a11y 8/8, Exit Check 12/13, code review APPROVE z follow-upami). README i `docs/FINGERPRINT.md` na miejscu.

## Stan repo
- `main` wypchnięty na https://github.com/PiotrekFilipecki/one-timeline (prywatne; Piotrek zrobił `gh repo create --push` ręcznie, bo klasyfikator auto-mode blokował push).
- Lint 0 · tsc 0 · build 0 · `npm test` 57/57 (18 skipped = shots; projekt `perf` po `chromium`; 3 workery; `unit` i `blob` obok testów w przeglądarce) · media: p0 16 PNG · p1 26 PNG + 2 webm · p2 46 PNG + 2 webm · p3 30 PNG + 2 webm · p4 16 PNG + 2 nagrania całej strony.

## Co istnieje
- 8 plakatów (`src/chapters/*`), treść z `docs/COPY.md`, kolory z `src/lib/palette.ts` (inline na `[data-chapter]`).
- **P1:** opener (8 pasków), hero odgrywane słowo po słowie (`src/motion/hero.ts`), POSITION z dyptykiem i głowicą (`position.ts`, `playhead.ts`), hover szerokości (`hover.ts`), skok z wagą (`jump.ts`). Komponenty klienckie: `HeroMotion`, `PositionMotion`, `Playhead`.
- **P3:** COST (orbita transform vs left/top z odczytem layoutu, liczba ms, czerwień po budżecie; `cost.ts`), YOURS (edytowalna linijka `tl.to()`, `src/lib/yours.ts` + `yours.ts`), pętla do hero (koniec dokumentu, link „Back to the top"), źródła i kolofon (`Sources` w `Yours.tsx`), no-JS i reduced motion dla całej strony.
- **P2:** EASE onion skin (`ease.ts`, `src/lib/eases.ts`), STAGGER siatka 16×7 / 8×7 (`stagger.ts`), SCRUB przypięty na scrollu (`scrub.ts`), REVERSE z realnym `easeReverse` (`reverse.ts`), wszystkie cięcia w `cuts.ts` (koordynator, jedno koło, litera per rozdział), rejestr rozdziałów `stage.ts`. Komponenty: `EaseMotion`, `StaggerMotion`, `ScrubMotion`, `ReverseMotion`, `Cuts`.
- Anybody variable (wdth 50–150, wght 100–900) przez `next/font`, bramka fontów z deadline 2 s (`src/motion/boot.ts`, `MotionBoot`).
- Rdzeń ruchu `src/motion/`: `register` (beat / beat-exit), `reduced-motion`, `boot` (bramka + opener raz na sesję), `split` (box słowa trzyma szerokość, litery przypięte), `chapter` (prepare → start → intro → rest → outro → end; seek dla głowicy).
- Testy: `unit` (czyste funkcje: YOURS, formatTime, parser COPY), `blob` (SSR kształtów, morf kropla → bilet, krzywa EASE, reduced motion), `contrast`, `layout` (7 szerokości; 0 przesunięć), `interactive` (hover/focus 26 kontrolek), `a11y` (nagłówki, slidery, etykiety, ścieżka Tab z widocznym focusem, dotyk), `chain`, `ease`, `perf` (fps, LCP, CLS, JS, długie klatki per rozdział; projekt serial po reszcie), `cost`, `yours`, `loop`, `nojs`, `reduced`, `font`, `cut`, `playhead`, `opener`, `shots` + `shots-p1/p2/p3/p4`.
- Dokumenty: `docs/adr/0001-architektura.md`, `docs/devlog/P0-fundament.md`, `CLAUDE.md`.

## Do decyzji Piotrka
- **Bramka P1 (telefon, 20 min):** „występ czy animacja?" Werdykt jednym zdaniem do `docs/devlog/P1-hero.md`, sekcja „Do oceny przez Piotrka" (cięcie, skok z wagą, głowica).
- **Bramka P2 (telefon):** przewinięcie hero → mięta bez zacięć; każdy rozdział zrozumiały bez podpisu. Uwaga na kontur duchów EASE (czy z daleka nie wygląda na trzeci kolor) i spacjowanie SCRUB w stanie wąskim.
- **Bramka P3:** cała strona od hero do pętli; bez JS i z reduced motion czytelna. COST: na Macu bez spowolnienia tryb left/top nie robi się czerwony (4 litery to 0.03 ms layoutu na zapis; devlog P3, decyzja 1); na telefonie do sprawdzenia.
- **Bramka P4 = v7 gotowe:** 30 min z telefonem (lista w devlogu P4, pięć linijek), lista poprawek, decyzja o wdrożeniu. Trzy rzeczy do rozważenia z Exit Checku: start SCRUB w wght 100 na 390 px, kopie EASE na telefonie, hairline głowicy jako „ramka".
- Bramka P0: `docs/media/p0/`, czy kolory szaleją tak, jak chciałeś; YOURS ma trzy farby zgodnie z MOTION.md.
- MOTION.md: ścieżka `beat` poprawiona w P0 (dopisany punkt kontrolny). Krzywe nie były strojone w P1. Kadencje hero (`CADENCE` w `hero.ts`: 0.045–0.12 s / znak) są nad tabelą staggerów MOTION.md (0.02–0.04); jeśli zostają po bramce P1, tabela powinna dostać wyjątek dla hero.

## Otwarte propozycje (ADR / devlog)
- Geist Mono zamiast stosu systemowego dla kodu.
- `cacheComponents: false` dla prostoty (strona statyczna).
- Dyptyki na telefonie o ~1 vw większe.
