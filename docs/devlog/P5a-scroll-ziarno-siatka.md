# P5a · v7.1: scroll, ziarno, siatka, copy, favicon (29.10.2026)

Model: Fable 5.1. Pierwszy z trzech PR-ów v7.1 po werdykcie Piotrka (kolory tak, ruch nie; kierunek w `MOTION.md` → „v7.1" i w pamięci sesji). Skille: `animaxxing` (smooth-scroll, scroll-effects: parallax, velocitySkew), `gsap-nextjs` (lifecycle), `taste-guardrail` (układ), `a11y-gate`.

## Co weszło

- **ScrollSmoother** (`src/motion/scroll.ts`, `PageScroll`): 1 s na pointerze, dotyk i reduced motion natywne, `effects: true`. Warstwy fixed (paski openera, koło cięcia, ziarno) wyniesione poza treść smoothera do `page.tsx`, bo treść jedzie transformem.
- **Progi cięć od celu scrolla.** Z wygładzaniem treść dojeżdża sekundę po pasku, więc progi liczone z `getBoundingClientRect` krzyżowały się po kolei i przy skoku na koniec grało cięcie YOURS zamiast pętli. Teraz `viewTop(el) = rect.top + wygładzony scroll − pasek` (`scroll.ts`): decyzja „najdalsze cięcie wygrywa" zapada od razu na zdarzeniu scroll, jak bez smoothera. Koordynator słucha też `onUpdate` smoothera. Skoki dokumentu przez `jumpTo()` (`smoother.scrollTo(y, false)`), nie `window.scrollTo`.
- **Błąd z v7 wyłapany przy okazji:** po pętli do hero koordynator grał cięcie POSITION wstecz (śliwkowe koło nad hero), bo wszystkie cięcia były w stanie „za". Po pętli wracają cicho do „przed" (`createLoop(..., onLooped)`).
- **Ziarno papieru:** `scripts/grain.mjs` → `public/grain.png` (256 px, komórki 2×2, deterministyczne, 25 KB), overlay fixed, multiply, 9 %. Jedyny wyjątek od „dwóch farb" zapisany w MOTION.md. Kontrasty z palety zostają (multiply tylko przyciemnia pole).
- **Dekoracje na scrollu** (`decor.ts`): numer rozdziału w konturze (`.numeral`, 44 vw, text-stroke 2 px, 55 % krycia) jedzie ±14 % w poziomie z sekcją, co drugi w kontrze, i pochyla się z prędkości scrolla (≤ 8°, quickSetter na skewX). Hero ma `tl`. SCRUB przypięty: jego numer stoi.
- **Parallax stopki:** `data-speed="1.06"` na `Foot` (bez SCRUB). Harness układu odejmuje translacje przodków do sekcji, więc dalej mierzy 0 przesunięć.
- **Układ plakatu:** etykieta rozdziału pionowo wzdłuż lewej krawędzi (`writing-mode: vertical-rl` + rotate 180°), siatka `label | stage/foot`, kod jako bilet (perforacja z lewej), dyptyki zsunięte po przekątnej z nachodzeniem 0.1 em (OVERLAP dosłownie nachodzi), YOURS przez grid-areas zamiast `order`. Na telefonie numer w górnym rogu (stopka z tekstem jest na dole).
- **`overflow: clip` zamiast `hidden` na sekcji.** `hidden` robi z sekcji kontener przewijania: focus na Replay (4 px pod krawędzią przez parallax stopki) przewijał sekcję o 4 px, co harness złapał na 360–768 px.
- **Copy z mrugnięciem** (`docs/COPY.md`, ≤ 15 słów): „Mind the gap", „Nobody argues", „Yes, that one", „crawls like a snail", „sets it on fire", „Break it, we reset".
- **Animowany favicon** (`Favicon.tsx`): sygnatura w 64 px, pole N → koło N+1 rośnie na expo.in 0.9 s → cięcie → 0.6 s stania; 12 fps na canvasie, `link[rel=icon]` podmieniany data URL; stoi przy reduced motion i w tle. Bez JS: `app/icon.svg`.
- **Stopka:** „Made by Piotrek Filipecki" z `## author` w COPY.md (Portfolio, GitHub). Sociale do uzupełnienia, gdy Piotrek poda adresy.
- **COST:** czerwień tylko w trybie left/top. Z smootherem i ziarnem koszt klatki wzrósł na tyle, że 4 równoległe przeglądarki w testach przekraczały 17.5 ms w trybie transform i pole robiło się czerwone bez winy `transform`. Liczba ms zostaje prawdziwa w obu trybach; czerwień mówi o left/top, nie o obciążeniu maszyny (zmiana decyzji 1 z devloga P3).

## Dogrywka: sociale i SEO (ten sam PR)

- Stopka: Portfolio, LinkedIn, Instagram, GitHub (`## author` w COPY.md), `rel="me"`.
- `src/lib/site.ts`: adres strony (Vercel do czasu domeny), tytuł, opis, autor z COPY.md. Metadane w `layout.tsx`: title template, description z nazwiskiem, keywords, `authors` / `creator` / `publisher`, canonical, robots (index, follow, max-image-preview large), Open Graph i Twitter card `summary_large_image`.
- `app/opengraph-image.png` (1200×630) z `scripts/og.mjs`: zrzut hero w spoczynku z działającego builda (prawdziwy font i ziarno; `next/og` nie ma Anybody z next/font w czasie builda) + `opengraph-image.alt.txt`.
- JSON-LD (`@graph`): WebSite, WebPage (about: GSAP, web animation; keywords) i Person (Piotrek Filipecki, url portfolio, `sameAs` LinkedIn, Instagram, GitHub) jako `author` i `creator`. To jest to „pozycjonowanie mnie": nazwisko w meta author/creator, w treści stopki i w schemie z profilami.
- `app/robots.ts` (allow all, sitemap) i `app/sitemap.ts` (jedna strona). Build: `/robots.txt`, `/sitemap.xml`, `/opengraph-image.png` prerenderowane.
- Czego nie ma i co warto dodać po domenie: własna domena w `SITE_URL` (dziś one-timeline.vercel.app), Google Search Console (weryfikacja przez meta `verification` w metadata), link zwrotny z portfolio do tej strony (najsilniejszy sygnał „to moje").

## Pomiary

- lint 0 · tsc 0 · build 0 · `npm test` 53 passed, 16 skipped (shots), 2.8–3.7 min (w tym dwa nowe zachowania: progi od celu, reset po pętli). Jeden run miał timeout cięcia na 1920 px pod 4 workerami (samodzielnie 2/2 zielone); limit w `cutTo` 10 → 15 s.
- Perf przy 4× CPU (perf.spec, serial): 60 fps we wszystkich rozdziałach, 0 długich klatek w ruchu, najgorsza klatka 31–39 ms (v7: 19–32 ms; smoother i grain mają swój koszt), hero start 1 długa klatka 93 ms. FCP 120 ms, LCP 148 ms (teraz `tl` w konturze), CLS 0. JS 731 KB raw / 236 KB gzip (+15 KB raw za ScrollSmoother).
- Zrzuty: `docs/media/p5a/` (16 rozdziałów + stopka). Obejrzane: głowice w spoczynku z prawej, numery za sceną, bilet kodu, pionowa etykieta, ziarno widoczne, na 390 numer w górnym rogu nie wchodzi pod tekst.

## Lekcje

- `scrollIntoView` wewnątrz wrappera ScrollSmoothera (fixed, overflow hidden) przewija wrapper, nie okno: żadne cięcie nie gra. Skrypt zrzutów i test głowicy używają `cutTo` (window.scrollTo).
- `ScrollSmoother.offset()` tworzy i zabija ScrollTrigger przy każdym wywołaniu: nie do nasłuchu scrolla. Pozycja w dokumencie = rect + `smoother.scrollTop()`.
- Sekcja z `overflow: hidden` jest przewijalna przez focus; `clip` nie.

## Następne (PR 2 i 3)

- P5b: blob-bohater (MorphSVG) z własnym patternem w farbie typografii, animowanym w trakcie morfu (prośba Piotrka), plus dekoracje SVG per rozdział (DrawSVG, MotionPath): linijka timeline'u w hero, kolejka, krzywa EASE, domino, jog wheel, ślimak, paragon, ołówek.
- P5c: szlif choreografii (ruch wtórny w intro rozdziałów), nagrania, FINGERPRINT, Exit Check.
- Otwarte z v7: SCRUB start w wght 100 na telefonie, kadencje hero vs tabela MOTION.md, sociale w stopce.
