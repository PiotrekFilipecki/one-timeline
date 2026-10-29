# FINGERPRINT · One Timeline v7 → v7.1

Odcisk palca do przeniesienia do `atelier/` (rejestr odcisków). Żeby kolejna strona nie powtórzyła tej.

## Gramatyka

- **Plakat na kadr.** Każdy rozdział = pełny kadr w dokładnie dwóch farbach: pole + typografia. Trzecia farba tylko w trakcie cięcia (dwa pola i koło) i w YOURS (body w mięcie, zapisane w palecie).
- **Jedna rodzina, jedna oś ruchu.** Anybody variable (wdth 50–150, wght 100–900), wght 800 / wdth 100 w spoczynku; mono systemowe tylko w linijkach kodu. Ruch robią osie fontu i transformy; nigdy width, height, left, top, color (wyjątek: COST, który pokazuje ich koszt).
- **Pokaż i odpocznij.** Rozdział wyzwalany wejściem w kadr gra raz (0.6–4.6 s) i staje jako czysta typografia; split liter rewertowany przy spoczynku, CSS jest jedynym źródłem spoczynku.
- **Jedna krzywa wejścia, jedna wyjścia.** `beat` (M0,0 C0.18,0 0.12,1.12 0.46,1.05 0.7,1.01 0.85,1 1,1), `beat-exit` (M0,0 C0.6,0 0.88,0.35 1,1). Mocniejszy moment (`back.out(2.2)` w osiadaniu skoku) maks. jeden na ekran.
- **Zero fade-up, zero crossfade.** Litery pojawiają się w chwili startu ruchu albo wchodzą zza maski (`clip-path`), znaczniki i przyciski rosną z podstawy (scaleY).

## Sygnatura (jedna)

**Cięcie przez literę.** Litera rozdziału N (kropka zdania, O z OVERLAP, ostatnie E aktora EASE, ostatnia komórka STAGGER, B ze SCRUB, R z easeReverse, O z COST, S z YOURS) rośnie jako koło w kolorze następnego pola na `expo.in` 0.6 s, w chwili zakrycia dokument skacze na górę następnego rozdziału, koło znika, rozdział wchodzi na `beat`. Wstecz: pełne koło, skok, kurczenie na `expo.out`. Ostatnie cięcie wraca do różu hero (pętla).

## Paleta (łańcuch)

róż `#FF4FB4` → śliwka `#4A0D3A` → acid `#C6FF1A` → niebieski `#2B1BFF` → żółty `#FFE500` → fiolet `#6A1BFF` → mięta `#A8F5CF` → zieleń `#06402B` → róż. Jank COST: czerwień `#FF3B12` (tylko display). Typografia rozdziału N = pole rozdziału N+1. Zero gradientów, cieni, przenikań.

## Rozdziały i ich ruchy

0. Hero: opener 8 pasków naraz, zdanie odgrywane słowo po słowie (skok z wagą, fala zza maski, opad z osiadaniem, od środka, rozciągnięcie, od końca), znaczniki czasu z labeli.
1. POSITION: dyptyk, skok z wagą `"+=0"` vs `"<0.06"`, jedna głowica.
2. EASE: 12 kopii na krzywej (onion skin z konturem), 4 easingi.
3. STAGGER: siatka liter 16×7 / 8×7, trzy przejścia (center, edges, random).
4. SCRUB: jedyny rozdział na scrollu, wdth 50 → 150, wght 100 → 900, litery przypięte do najszerszego stanu.
5. REVERSE: `reverse()` vs `easeReverse: true` jako dwa wiersze, realne timeline'y.
6. COST: orbita na transform vs left/top z odczytem layoutu, liczba ms, czerwień po budżecie.
7. YOURS: edytowalna `tl.to()` na literach słowa, pętla do hero.

## Elementy stałe

Indeks `0N NAZWA` mono w lewym górnym rogu; jedna linijka EN (≤ 15 słów) i linijki kodu w stopce; hairline głowicy 2 px w kolorze typografii, w spoczynku przy prawej krawędzi sceny; przyciski mono z obrysem 2 px, `aria-pressed` wypełnione farbą typografii; zero zaokrągleń.

## Inżynieria, która jest częścią odcisku

Bramka pierwszej klatki (`data-motion-boot`, deadline 2 s); box słowa trzymany przez split; harness 0 przesunięć względem sekcji na 7 szerokościach; cięcia na własnym nasłuchu scrolla z koordynatorem (najdalsze gra, wcześniejsze przechodzą cicho); strona czytelna bez JS; reduced motion = spoczynek wszędzie.

## Czego NIE powtarzać następnym razem

Osiem nasyconych pól w łańcuchu; koło rosnące z litery; onion skin z konturem; siatka liter; hairline głowicy. To są znaki tej strony.

## v7.1 (29.10.2026): plakat z jajem

Po werdykcie autora (kolory tak, ruch nie) odcisk dostał drugą warstwę. Zostaje sygnatura (cięcie przez literę), dochodzi bohater i dekoracje.

- **Bohater: blob z rastrem.** Jeden kształt (kropla) wędruje przez rozdziały i morfuje w pojęcie: bilet (POSITION), kulka na krzywej (EASE), domino (STAGGER), jog wheel (SCRUB), ślimak (REVERSE), płomień (COST po budżecie), wybuch (YOURS). Wypełnienie: rastr kropek w farbie typografii; w trakcie każdego morfu pattern robi pełny obrót i puchnie, po czym wraca do stanu z serwera. Dalej dwie farby.
- **Dekoracje, które grają:** linijka master timeline'u pod zdaniem hero rysowana w czasie rzeczywistym; krzywa EASE rysowana i morfowana z przyciskami; duchy domina; spirala muszli; numer rozdziału w konturze jadący w kontrze do scrolla ze skosem z prędkości.
- **Scroll:** ScrollSmoother 1 s (dotyk natywny), parallax stopki 1.06, progi cięć liczone od celu scrolla.
- **Ziarno papieru:** statyczny kafelek, multiply 9 %; jedyny wyjątek od „dwóch farb".
- **Układ:** etykieta pionowo wzdłuż krawędzi, numer w konturze za sceną, kod jako bilet z perforacją, dyptyki zsunięte po przekątnej z nachodzeniem.
- **Ton:** copy z mrugnięciem („Mind the gap", „Yes, that one", „sets it on fire"), favicon z cięciem w 64 px, `tl` w konturze pod zdaniem.
- **Czego nie powtarzać po v7.1:** rastr kropek jako faktura bohatera, ślimak jako żart o ease-out, numer w konturze za sceną, bilet z perforacją na kod. Następny projekt bierze inną fakturę (kreskowanie, półtony liniowe) i innego bohatera.
