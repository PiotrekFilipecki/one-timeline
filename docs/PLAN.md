# One Timeline v7 · PLAN

Strona-eksplainer o GSAP timeline, zrobiona tak, żeby sama była dowodem: każde pojęcie odgrywa słowo, które je nazywa. Treść po angielsku.
Poprzednia wersja: artifact v6 (`reference/v6-one-timeline.html`), werdykt „średnio”. Ten plan ją zastępuje, nie poprawia.
Brief ruchu: `MOTION.md` w katalogu głównym repo (wiążący).

## 1. Referencja: Museum of Motion (Codrops, 26.10.2026)

Artykuł: https://tympanus.net/codrops/2026/10/26/animating-agents-gsap-animaxxing/ · demo: https://tympanus.net/Demos/MuseumOfMotion/ · kod: https://github.com/johnpolacek/museum-of-motion (klon w `reference/museum-of-motion`, poza gitem).

Dlaczego to klasa światowa:
1. **Redukcja.** Jedno pole koloru, jeden variable font (Archivo wght+wdth). Zero tekstur, cieni, ikon, kart.
2. **Typografia jest aktorem.** Ruch robią osie fontu. Każde słowo hero odgrywa technikę, którą nazywa, i ląduje jako czytelne zdanie.
3. **Brief ruchu przed kodem.** Osobowość, 5 zasad, 1 krzywa wejścia + 1 wyjścia, tabela czasów.
4. **Pokaż i odpocznij.** Każdy element gra raz i staje.
5. **Cykl życia:** start → intro → spoczynek → outro → koniec. Wyjścia ~2× krótsze.
6. **Twarda inżynieria:** brak mignięcia, split po fontach, przypięte szerokości, test przesunięć układu na 7 szerokościach (31/76 → 0), czytelne bez JS, reduced motion, focus = hover.
7. **Kuracja:** nudne eksponaty wycięte, nazwy mówią, co widać.
8. **Proces:** jeden eksponat dopięty do końca, dopiero potem reszta.

## 2. Diagnoza v6

- Kostium rekwizytów: 3 tła z teksturami, ziarno, chipy, dok, wykres canvas, ponad 350 cząsteczek, kamera, nić SVG z 7 morfami.
- Dwa fonty, żaden nie gra (Unbounded statyczny).
- ~10 easingów bez sygnatury.
- Wszystko scrubowane: nic nie gra we własnym tempie i nic nie odpoczywa.
- Wykład zamiast pokazu: notatki, zakładki kodu, kalkulator.
- Brak testu układu, ścieżki bez JS i pełnego reduced motion.

## 3. Lock

- **Świat:** dwukolorowy druk w ruchu: riso i sitodruk × kinetyczne identyfikacje Studio Dumbar × Experimental Jetset.
- **Font:** Anybody variable (wdth 50–150, wght 100–900). Jedna rodzina. Mono tylko w linijkach kodu.
- **Kolor:** 8 nasyconych pól, łańcuch kolorów i kontrasty w `MOTION.md`. Każda klatka to dokładnie 2 kolory.
- **Sygnatura (jedna):** cięcie przez literę. Litera rośnie, jej kolor wypełnia kadr i staje się następnym rozdziałem.
- **Głowica:** hairline w kolorze typografii, słowo gra, gdy ona przez nie przechodzi; przeciągalna i sterowalna klawiaturą.
- **Pokrętła:** wariancja 8 · ruch 8 (jeden występ naraz) · gęstość 3.
- **NIE może wyglądać jak:** tęczowy landing z „kolorowymi sekcjami” i gradientami; kopia kobaltu Museum of Motion; v6.

## 4. Rozdziały

Ciągły scrollytelling, ale rozdziały wyzwalane wejściem w kadr (grają raz, potem stoją). Scrub tylko w SCRUB. Między rozdziałami zawsze cięcie przez literę.

0. **Hero** (róż/śliwka): opener 8 kolorów (~0.8 s), zdanie „Sequence, overlap, ease, stagger, scrub, reverse.”, każde słowo odgrywa siebie. Indeksy górne = znaczniki czasu (`0:00.90`). Jedna linijka EN + Replay.
1. **POSITION** (śliwka/acid), dyptyk: SEQUENCE nad OVERLAP, ta sama skala, jedna głowica przez oba. `"+=0"` vs `"<0.06"`. Pod spodem dwie linijki kodu.
2. **EASE** (acid/niebieski): onion skin, 12 kopii słowa rozstawionych według easingu; 4 easingi przełączane.
3. **STAGGER** (niebieski/żółty): słowo z siatki liter; center / edges / random jako trzy przejścia głowicy.
4. **SCRUB** (żółty/fiolet): jedyny rozdział na scrollu; wdth 50→150, wght 100→900.
5. **REVERSE** (fiolet/mięta), dyptyk: `reverse()` vs `easeReverse: true`.
6. **COST** (mięta/zieleń): `transform` vs `left/top` z odczytem layoutu, realny jank; jedna wielka liczba ms; przy przekroczeniu budżetu pole tnie się na czerwień.
7. **YOURS** (zieleń/róż): edytowalna linijka `tl.to()` + Play na słowie YOURS; ostatnie cięcie wraca do różu hero. Źródła i kolofon.

Wycięte z v6: kamera, nić SVG, tekstury, ziarno, chipy, dok, notatki inżynierskie, zakładki kodu, kalkulator.

## 5. Stack

Next.js 16 (App Router) + TypeScript + SCSS Modules (zero Tailwind) + gsap 3.15.0 + @gsap/react 2.1.2 + Playwright 1.64.1. Wersje sprawdzone 28.10.2026 przez `npm view`. Font przez `next/font/google` z osiami wdth i wght. Skille: Animaxxing (`animaxxing`, `gsap-nextjs`) jako przepisy i cykl życia, `design-motion:gsap-*` jako API.

## 6. Fazy i bramki

| Faza | Co | Bramka |
|---|---|---|
| P0 | fundament: tokeny, font, rdzeń ruchu, harness testów | strona statycznych plakatów działa bez JS, testy zielone |
| P1 | hero + opener + POSITION + cięcie + głowica | **Ty akceptujesz kierunek na telefonie, zanim powstanie reszta** |
| P2 | EASE, STAGGER, SCRUB, REVERSE | każdy rozdział gra raz i staje, cięcia w łańcuchu |
| P3 | COST, YOURS, pętla, no-JS, reduced motion | pełna strona przechodzi bez JS i z reduced motion |
| P4 | bramki jakości, telefon, wdrożenie | 0 przesunięć na 7 szerokościach, Exit Check ≥10/14, a11y-gate |

## 7. Ryzyka

- 8 kolorów może zjechać w „tęczę”. Zabezpieczenie: 2 farby na klatkę, zero gradientów, kolor zmienia tylko cięcie. Wymiana koloru = przeliczenie łańcucha testem kontrastów.
- Anybody przy wdth 150 / wght 900 jest bardzo szeroki: hero łamane na krawędziach, sprawdzane na 390 px.
- Cięcie przez literę: skalowanie ×30–60 na osobnym elemencie, nie na tekście.
