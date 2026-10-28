# MOTION.md · One Timeline v7

Przeczytaj przed dodaniem albo zmianą jakiejkolwiek animacji. Ten plik wygrywa z domyślnymi wartościami skilli.

## Osobowość: kinetyczny plakat z wagą

Typografia żyje i ma masę. Strona to plakat dwukolorowego druku, który daje występ: litery biorą zamach, wystrzeliwują, lądują ze squashem i osiadają. Ruch jest odważny i precyzyjny. Kolor zmienia się wyłącznie twardym cięciem.

## Zasady

1. **Typografia jest aktorem.** Osie Anybody: `wdth` 50–150 i `wght` 100–900 robią większość roboty. Zmiana szerokości albo wagi zamiast fade.
2. **Wejście z przestrzeleniem, wyjście czyste.** Wejścia lekko przestrzeliwują i osiadają. Wyjścia szybkie, proste, bez przestrzelenia.
3. **Pokaż i odpocznij.** Każdy element gra raz i staje. Ruch ambientowy rzadko, zawsze z pauzą.
4. **Dwie farby na klatkę.** Na ekranie zawsze dokładnie 2 kolory: pole i typografia. Trzeci tylko w trakcie cięcia przez literę. Kolor nigdy nie jest tweenowany, nie ma gradientów ani przenikań.
5. **Tylko tanie właściwości.** transform, opacity, clip-path, osie fontu (`font-variation-settings`). Nigdy width, height, top, left, color (wyjątek: rozdział COST, który celowo pokazuje koszt `left/top`).

## Paleta (łańcuch: typografia rozdziału N = tło rozdziału N+1)

| Rozdział | Tło | Typografia | Kontrast |
|---|---|---|---|
| hero | `#FF4FB4` róż | `#4A0D3A` śliwka | 4.99 |
| position | `#4A0D3A` śliwka | `#C6FF1A` acid | 12.57 |
| ease | `#C6FF1A` acid | `#2B1BFF` niebieski | 6.55 |
| stagger | `#2B1BFF` niebieski | `#FFE500` żółty | 6.09 |
| scrub | `#FFE500` żółty | `#6A1BFF` fiolet | 5.12 |
| reverse | `#6A1BFF` fiolet | `#A8F5CF` mięta | 5.17 |
| cost | `#A8F5CF` mięta | `#06402B` zieleń | 9.36 |
| cost (jank) | `#FF3B12` czerwień | `#06402B` zieleń | 3.31, tylko display |
| yours | `#06402B` zieleń | `#FF4FB4` róż (pętla do hero) | 3.96, tylko display; body w `#A8F5CF` (9.36) |

Body tekst ≥4.5:1, display ≥3:1. Zmiana koloru = zmiana tokenu w jednym miejscu + przeliczenie kontrastów testem.

## Krzywe

Jedna krzywa wejścia, jedna wyjścia, rejestrowane raz przez CustomEase przed pierwszym builderem.

```ts
CustomEase.create("beat", "M0,0 C0.18,0 0.12,1.12 0.46,1.05 0.7,1.01 1,1");   // szybki atak, ~6% przestrzelenia
CustomEase.create("beat-exit", "M0,0 C0.6,0 0.88,0.35 1,1");                  // wolny start, szybki koniec, zero przestrzelenia
```

- `beat`: wszystkie wejścia.
- `beat-exit`: wszystkie wyjścia.
- Cięcie przez literę: rośnięcie na `expo.in` (0.5–0.7 s), twarde cięcie, następne słowo wchodzi na `beat`.
- Mocniejszy moment (`back.out(2.2)`, `elastic.out(1, 0.45)`): maks. jeden na ekran.
- Krzywe są punktem startu: stroimy je w P1 na żywo, a zmianę zapisujemy tutaj.

## Czasy

| Rola | Czas | Stagger |
|---|---|---|
| Display: wejście | 0.6–1.1 s | 0.02–0.04 s / znak, 0.06 s / linia |
| UI: etykiety, kod, przyciski | 0.3–0.45 s | 0.04 s |
| Każde wyjście | 0.25–0.35 s | 0.012–0.03 s |
| Cięcie przez literę | 0.5–0.7 s rośnięcie + 0 s cięcie | brak |
| Hover / focus | 0.25 s in, 0.35 s out | brak |

Wyjścia mniej więcej o połowę krótsze od wejść.

## Sygnaturowe ruchy

- **Skok z wagą.** Antycypacja (scaleY 0.8, scaleX 1.12) → strzał w górę ze stretchem → opad → squash przy lądowaniu → osiadanie na `back.out`.
- **Rozciągnięcie.** Display wchodzi skondensowany (wdth 50) i rozszerza się do spoczynku, albo wchodzi szeroki (150) i się zaciska.
- **Przybranie wagi.** Typografia wchodzi lekka (wght 100) i ciężeje przy lądowaniu.
- **Cięcie przez literę (sygnatura strony).** Jedna litera słowa rośnie, aż jej kolor wypełni kadr, i staje się tłem następnego rozdziału. Robione na osobnym elemencie (prostokąt w kolorze litery startujący z jej bounding boxa albo klon litery), nigdy przez skalowanie tekstu ×50.

## Per powierzchnia

- **Hero.** Opener na load: 8 par kolorów przelatuje twardymi cięciami w ~0.8 s (maks. 3 błyski na sekundę, WCAG 2.3.1), ląduje na różu. Potem zdanie „Sequence, overlap, ease, stagger, scrub, reverse.”: każde słowo odgrywa swój rozdział i ląduje jako czytelne zdanie. Indeksy górne to znaczniki czasu na master timeline. Replay odtwarza tylko zdanie.
- **Rozdziały.** Wyzwalane wejściem w kadr: grają raz, potem stoją. Wyjątek: SCRUB, jedyny rozdział sterowany scrollem.
- **Głowica.** Hairline w kolorze typografii przejeżdża przez słowo; słowo gra w chwili przejścia. Można ją złapać (pointer) i przesuwać strzałkami (role=slider), co ustawia `tl.progress()`.
- **Przewijanie w tył.** Cięcie gra wstecz z `easeReverse` (wyjście zachowuje własną krzywą).

## Reguły

- Ruchy szerokości i wagi zmieniają szerokość tekstu: przypnij szerokość każdej litery do jej najszerszego stanu przed ruchem albo używaj ich tylko na display z zapasem miejsca. Bez zaokrąglania szerokości (lekcja Museum of Motion: 276.6 px → 277 px przerzucało linię).
- Dziel tekst dopiero po `document.fonts.ready`. Tekst ukryty maks. do krótkiego deadline'u; jeśli JS nie dojedzie, strona jest czytelna jako statyczne plakaty.
- Hover ma odpowiednik na focus. Dotyk nigdy nie zostawia zawieszonego hovera.
- Reduced motion: każdy element w stanie spoczynku, bez splitu, bez openera, bez pętli; kolory zostają, cięcia zastępuje natychmiastowa zmiana pola.
- Pętla dłuższa niż 5 s ma pauzę.
- Jeden właściciel transformu na element: efekty pointer/ambient zatrzymuj przed wyjściem.
