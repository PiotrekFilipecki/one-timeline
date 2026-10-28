# ADR-0001: Architektura One Timeline v7

## Status
Accepted (P0, 2026-10-28)

## Context
v6 była jednym artifactem HTML: jeden master timeline scrubowany całą stroną, 350+ cząsteczek, kamera, nić SVG, dwa fonty. Nic nie grało we własnym tempie i nic nie odpoczywało. Wzorem dla v7 jest Museum of Motion (Codrops, 26.10.2026): jedna rodzina variable, brief ruchu przed kodem, cykl życia per element, twarda inżynieria pod spodem (brak mignięcia, split po fontach, przypięte szerokości, 0 przesunięć układu). PLAN.md §3–4 i MOTION.md są wiążące; ten ADR zapisuje tylko *jak* to ułożyć w kodzie.

Ograniczenia: solo dev, Next.js 16.4.3 (App Router), gsap 3.15.0, @gsap/react 2.1.2, SCSS Modules, Playwright 1.64.1. Strona musi być czytelna bez JS i przy reduced motion.

## Decision

1. **Jedna strona, jedna trasa (`/`).** Osiem rozdziałów to osiem pełnoekranowych plakatów w jednym dokumencie. Zero podstron.
2. **Rozdziały jako komponenty.** `src/chapters/<Name>.tsx` to Server Components: renderują stan spoczynku (słowo, linijka, kod) z `docs/COPY.md` przez `src/lib/copy.ts`. Ruch dokłada osobny komponent kliencki per rozdział (od P1), który dostaje gotowy DOM i nigdy nie zmienia treści.
3. **Kontroler cyklu życia per rozdział.** `src/motion/chapter.ts`: `start → intro → rest → outro → end`. Jeden rozdział gra naraz (pokrętło „ruch 8"): wejście nowego rozdziału przerywa poprzedni skokiem do spoczynku, nie kolejką. Szybkie przewinięcie przez kilka rozdziałów = kilka skoków, zero animacji w locie. Unmount = kill + revert.
4. **Wyzwalanie wejściem w kadr.** ScrollTrigger tylko jako czujnik (`onEnter`/`onLeave`), nie jako scrub. Timeline rozdziału gra raz i staje.
5. **SCRUB jako jedyny wyjątek.** Tylko rozdział SCRUB ma `scrub` na ScrollTriggerze. Żaden inny rozdział nie może tego robić bez nowego ADR.
6. **Natywny scroll, bez Lenisa/ScrollSmoothera.** Smooth scroll nie niesie tu treści; dokłada warstwę między palcem a głowicą SCRUB i psuje `javaScriptEnabled: false`.
7. **SSR renderuje spoczynek, JS go odgrywa.** HTML z serwera to pełna, czytelna strona (8 plakatów). JS: (a) ukrywa display type pod bramką `data-motion-boot="pending"` do `document.fonts.ready`, z deadline'em 2 s zapisanym w `src/motion/boot.ts`; (b) od P1 odgrywa intro od stanu startowego do tego samego spoczynku. Bramka nigdy nie jest w HTML z serwera: bez JS nie ma bramki.
8. **Paleta jako jedno źródło.** `src/lib/palette.ts` (8 rozdziałów + stan jank, hex i role bg/fg/body). Komponent rozdziału ustawia zmienne CSS inline (`--bg`, `--fg`, `--body`) na `[data-chapter]`, więc kolory działają bez JS i bez duplikatu w SCSS. `src/styles/_tokens.scss` tylko je czyta. Test kontrastów liczy wzorem WCAG z tych samych danych.
9. **GSAP wyłącznie przez `src/motion/`.** `register.ts` to jedyny moduł importujący gsap i pluginy; rejestruje `beat`/`beat-exit` raz, tylko po stronie klienta. Komponenty importują stamtąd, nigdy z `gsap` bezpośrednio.
10. **Font: Anybody przez `next/font/google`** z osiami `wdth` i `wght` (variable), latin + latin-ext, fallback z dopasowanymi metrykami (next/font robi `size-adjust`). Mono tylko w linijkach kodu, jako stos systemowy (`ui-monospace`…): zero drugiego webfontu, zero drugiej zależności w harnessie układu. (Propozycja: jeśli w P1 kod ma mieć charakter, wymienić na Geist Mono przez token `--font-mono`; to jedna linia.)
11. **Testy: Playwright jako jedyny runner** (`npm test`), przeciw buildowi produkcyjnemu na porcie 3124. Dev server ma overlay i HMR, które fałszują pomiar układu.
12. **`cacheComponents: true`** zostaje tak, jak postawił `create-next-app@16.4.3`. Strona jest statyczna, więc nie ma różnicy; od P1 kontrolery muszą być poprawne przy ponownym `useGSAP` na tym samym DOM (gsap-nextjs: „never assume a fresh node").

## Consequences
- Plus: strona istnieje bez JS; każdy rozdział można rozwijać osobno; jeden rdzeń ruchu; kolor nigdy nie jest w dwóch miejscach.
- Plus: harness układu działa od P0 i rośnie (hover/focus w P1, SCRUB w P2).
- Minus: bramka fontów opóźnia LCP display type o czas ładowania Anybody (preload, self-host; lokalnie < 50 ms). Bez JS tekst pokazuje się od razu, z FOUT.
- Minus: pliki statyczne (COPY.md) czytane z `fs` w Server Component wiążą `page.tsx` z build-time; to jest zamierzone (treść = repo).
- Dług świadomy: `chapter.ts` w P0 nie ma jeszcze żadnego klienta; jego API może się przesunąć w P1 po pierwszym realnym intro. Zmianę zapisać w devlogu P1, nie cicho.

## Alternatives considered
- **Jeden master timeline scrubowany całą stroną (v6).** Odrzucone: nic nie gra we własnym tempie, każdy ruch jest zależny od prędkości kciuka, głowica nie ma sensu.
- **Osobne podstrony per rozdział (jak eksponaty Museum of Motion).** Odrzucone: sygnatura strony to cięcie przez literę między rozdziałami, które wymaga jednego dokumentu; osiem plakatów w jednym scrollu to też teza strony („one timeline").
- **Lenis / ScrollSmoother.** Odrzucone, patrz pkt 6.
- **Tailwind.** Odrzucone: reguła repo (SCSS Modules), zmienne per rozdział są prostsze w SCSS.
- **Vitest + Playwright.** Odrzucone: jeden runner wystarcza; test kontrastów to czysta funkcja, którą Playwright odpala bez przeglądarki.
