# P3 · COST, YOURS, pętla, strona bez JS i z reduced motion (29.10.2026)

Model: Fable 5.1, effort high. Czas sesji: ok. 2 h 20 min (build ≈ 1 h, pomiary kosztu klatki ≈ 40 min, testy i media ≈ 40 min).

## Skille: co wybrałem i dlaczego

| Skill | Użyty do | Co wziąłem |
|---|---|---|
| `design-motion:gsap-performance` | cost.ts | Warstwa kompozytora przez `will-change: transform` w trybie transform (bez niej oba tryby malują na głównym wątku i niczym się nie różnią); `gsap.ticker` jako jeden zegar dla orbity i pomiaru. |
| `gsap-core` | yours.ts | `timeline.to(target, vars, position)` z pozycjami `"+=0"`, `"<"`, `"<0.1"`, `"-=0.3"`; `reverse()`, `progress()`. |
| `animaxxing` (`component-motion`, `press-feedback` jako wzorzec przycisków stanu; `ambient` dla orbity z pauzą) | CostMotion, YoursMotion | `aria-pressed` na przełącznikach, orbita tylko w kadrze (IntersectionObserver), pauza, bezpiecznik czasu w klatce. |
| `a11y-gate` | formularz YOURS, COST w stanie jank, kolofon | `label` dla każdego pola, `role="status"` z `aria-live` dla komunikatów, przyciski z nazwami; w jank body znika (3.31 to tylko display); linki z podkreśleniem i focus w `--fg`. |
| `motion-design` | yours.ts | Pozycje jako lekcja: `"+=0"` = sekwencja, `"<"` = razem, `"<0.1"` = fala, `"-=0.3"` = nachodzenie. |
| `taste-guardrail` (Exit Check) | niżej | |

## Co powstało (C1–C6)

- **C1 COST.** Litery COST orbitują (promień 0.14 em, 0.45 obr/s) z `gsap.ticker`. Tryb transform: `x/y` na warstwie kompozytora. Tryb layout (przycisk `aria-pressed`): te same litery na `left/top`, dosuwane po pikselu z odczytem `offsetLeft`/`offsetTop` po każdym zapisie (klasyczny layout thrashing), bez warstwy. Liczba ms na klatkę = średnia wykładnicza odstępów rAF, tabularne cyfry, odświeżanie ≤ 8×/s. Średnia > 17.5 ms przez 10 klatek → `--bg` ustawione na `#FF3B12` (set, nie tween), body znika; powrót na transform → mięta. Orbita tylko w kadrze (IO, próg 0.2), pauza `aria-pressed`. Bezpiecznik: po 40 ms pracy w klatce reszta kroków czeka na następną, strona nigdy nie zamarza.
- **C2 YOURS.** `tl.to(".letter", { x, rotation, duration, ease }, position)` z polami number i select (ease: beat, beat-exit, expo.out, back.out(1.7), none; position: `"+=0"`, `"<"`, `"<0.1"`, `"-=0.3"`). Walidacja i ograniczenia w `src/lib/yours.ts` (czyste funkcje, także dla stanu bez JS): x w zakresie, w jakim ostatnia litera zostaje w kadrze (mierzony przez `Range`, na 1440 to 0–259 px, na 390 0–57 px), rotation ±180, duration 0.1–3, listy zamknięte, wartość nieliczbowa → domyślna. Play buduje timeline i gra na literach YOURS, Reverse cofa, Copy kopiuje linijkę (schowek z fallbackiem). Linijka kodu odzwierciedla wartości po każdej zmianie.
- **C3 Pętla.** Próg = koniec dokumentu. Koło w kolorze hero rośnie z „S" YOURS, dokument skacze na górę, hero stoi w spoczynku (bez openera, bez replayu zdania), cięcie wraca cicho do stanu „przed", więc gra za każdym dojazdem do końca. Link „Back to the top" (`#top`) z klawiatury gra to samo; bez JS jest zwykłą kotwicą.
- **C4 Źródła i kolofon.** `<footer data-sources>` pod YOURS w zieleni z body w mięcie: 8 linków (GSAP 3.15 easeReverse, Timeline, ScrollTrigger, GSAP + React, web.dev o warstwach kompozytora, Long Animation Frames API, artykuł Codrops, Museum of Motion), Anybody (Tyler Finck, Etcetera Type Co.) i wersje bibliotek czytane z `package.json` w czasie builda.
- **C5 Bez JS i reduced motion.** Bez JS: 8 plakatów w spoczynku; COST pokazuje budżet 16.7 i jedno zdanie, YOURS statyczną linijkę i jedno zdanie (`[data-no-js]` widoczne tylko bez `html[data-js]`); kontrolki niewidoczne. Reduced motion: COST bez orbit i splitu, liczba to pomiar spoczynkowy 12 klatek; YOURS Play ustawia stan końcowy bez animacji; pętla = natychmiastowy skok.
- **C6 Testy.** `cost.spec` (12× CPU: tryb layout → czerwień < 2 s, body ukryte, liczba widoczna; powrót → mięta; pauza; poza kadrem orbita stoi), `yours.spec` (clamp x do max, duration 12 → 3, pusto → 0.8, listy, linijka, Play do końca w 1.2 s dla `"<0.1"`, litery w kadrze, Reverse do 0, Copy; reduced motion Play = koniec), `loop.spec` (koniec dokumentu → róż → scrollY 0 → hero rest bez openera; link z klawiatury), `nojs.spec` i `reduced.spec` dla całej strony, `layout.spec` z COST (przełączenie trybu) i YOURS (Play), `chain.spec` do YOURS (7 odegrań).

## Decyzje i lekcje

1. **Cztery litery na `left/top` nie pękają na tym Macu.** Pomiar (Chromium, 1440): jeden zapis `left` + odczyt `offsetLeft` na `position: relative` kosztuje 0.033 ms; `margin-left` 0.032, `width` 0.032, `font-size` 0.070 ms. Blink traktuje zmianę pozycji relative jako tanie przesunięcie, nie pełny layout. Przy 1× oba tryby pokazują 16.7 ms (vsync). Dopiero przy 10–20× CPU (rząd taniego telefonu) left/top z odczytem pęka (20×: 18.9 ms, jank), a transform nie (17.1 ms); przy 30× pękają oba. Test wymusza 12× (pomiar w teście: transform 16.8 → left/top 27.4 ms). Lekcja rozdziału jest prawdziwa, ale na szybkim sprzęcie nie widać jej bez spowolnienia; pole zostaje w mięcie, liczba mówi prawdę. Nie dopisałem sztucznej pracy, żeby wymusić czerwień.
2. **Bez `will-change` oba tryby malują na głównym wątku.** GSAP `x/y` na zwykłym inline-blocku też repaintuje; dopiero warstwa robi różnicę. Tryb transform ustawia `will-change: transform`, layout ją zdejmuje.
3. **Liczba = odstęp między klatkami, nie czas pracy.** Przy 60 Hz pokazuje 16.7 niezależnie od pracy, dopóki klatki nie spadają; to jest „koszt klatki" tak, jak czuje go użytkownik. Czas pracy JS byłby mylący (kompozytor i raster są poza nim).
4. **Natywna walidacja blokowała Play.** `x=259` przy `step=10` → przeglądarka nie wysyła `submit`, bez błędu w konsoli. Formularz ma `noValidate` i `step="any"`; walidacja jest nasza (clamp + komunikat w `role="status"`).
5. **Zasięg x z glifów, nie z boxu.** `h2` w kolumnie flex ma szerokość sceny, więc `box.right − stage.right = 0`; `Range` daje prawdziwą prawą krawędź słowa. YOURS zmniejszone z 26vw do 22vw, żeby było ~260 px miejsca.
6. **Atrybut stanu ≠ selektor** (trzeci raz): `data-cost-mode` na przycisku i na sekcji. Sekcja ma `data-mode`.
7. **Nagrania równoległe w jednym katalogu podbierały sobie pliki.** `recordVideo.dir` per szerokość, potem przeniesienie.
8. **Pętla nie dotyka ScrollTriggera.** Warunek „koniec dokumentu" i reset po cięciu to dwie opcje `createCut` (`forwardWhen`, `resetAfterForward`); koordynator w `cuts.ts` traktuje ją jak każde inne cięcie.

## Pomiary

- `npm run lint` 0 · `npx tsc --noEmit` 0 · `npm run build` 0 · `npm test`: 36 passed, 14 skipped (shots), 2.5 min · `npm run shots p3`: 6 passed; `docs/media/p3/`: 16 PNG spoczynku + 10 klatek (COST transform/jank, YOURS rest/playing, pętla 50 %) + 4 pełne strony (bez JS, reduced motion; 1440 i 390) + 2 webm.
- **COST (Chromium 1440):** flush layoutu 0.033 ms; 1×: transform 16.7 / layout 16.7 ms; 4×: 16.7 / 16.8; 6×: 16.7 / 17.0; 10×: 24.5 / 16.7 (jank w layout); 20×: 17.1 / 18.9 (jank tylko w layout); 30×: 18.1 / 32.1 (oba). Test @12×: 16.8 → 27.4 ms, czerwień < 2 s, powrót → mięta.
- **YOURS:** zakres x 0–259 px (1440), 0–57 px (390); `"<0.1"` × 5 liter × 0.8 s = 1.20 s; ostatnia litera w kadrze po Play.
- **Łańcuch:** 7 cięć (… → COST `#A8F5CF` → YOURS `#06402B`), pętla → róż `#FF4FB4`, `scrollY` 0.
- **Układ:** 7 szerokości, 0 przesunięć także w COST (zmiana trybu) i YOURS (Play).
- **Bez JS / reduced motion:** 8 słów w kolorach, zdania `[data-no-js]` widoczne tylko bez JS, kontrolki ukryte; z reduced motion COST bez splitu, liczba > 0, bez jank.

## Klatki i nagrania (obejrzane)

- `cost-transform-1440`: litery w orbicie (C i O nachodzą, T wysoko), 16.8 ms. `cost-jank-1440`: pole czerwone, 27.0, body i etykieta znikły, zostały słowo i liczba: twarde cięcie, jedna wiadomość.
- `yours-rest` / `yours-playing`: linijka nad formularzem, trzy kolumny mono, Y w obrocie; 390: formularz w dwóch kolumnach, słowo na dole.
- `loop-50`: róż rośnie z „S" nad źródłami. `full-nojs-390`: osiem plakatów, EASE z CSS, siatka STAGGER 8×7, COST 16.7 z jednym zdaniem, YOURS z linijką, źródła.
- `cost-yours-loop-*.webm`: cięcie do COST, orbita, przełączenie w czerwień przy 12×, powrót, cięcie do YOURS, Play, Reverse, pętla.

**Exit Check (taste-guardrail, 11/13):** jak w P1–P2; formularz YOURS w mono z obrysem w `--fg`, bez zaokrągleń, bez kart ✓; jank jako jedna czerwona płaszczyzna ze słowem i liczbą = izolacja ✓; głębia n/d ✗; napięcie: YOURS cięte dołem obok formularza ✓.
**Test kostiumu:** przyciski i pola to elementy z PLAN §4 („edytowalna linijka", „przełącznik"); kolofon to lista linków i jedno zdanie. Bez rekwizytów.

## Poza zakresem, do rozważenia

- COST na szybkim sprzęcie: sensowna byłaby druga liczba „czas pracy w klatce" (transform 0.05 vs layout ~1 ms), która pokazuje różnicę także bez spadku klatek. Niezgodne z „jedna wielka liczba", więc nie.
- YOURS `rotation` obraca litery wokół ich środka; `transformOrigin` jako szóste pole byłoby ciekawe, ale PLAN mówi o pięciu.
- Kotwica `#top` na `<main>`: Next ostrzega przy `id` na `main`? Nie, build czysty.

## Pięć linijek

1. **Jak zobaczyć:** `npm run dev -- -H 0.0.0.0`; cała strona od hero do pętli; `docs/media/p3/` i `cost-yours-loop-*.webm`.
2. **Co pominąłem:** nic z C1–C6. Czerwień w COST na Macu bez spowolnienia nie wystąpi (decyzja 1), na telefonie do sprawdzenia.
3. **Co ręcznie:** bramka P3: cała strona od hero do pętli; bez JS i z reduced motion dalej czytelna. Na telefonie: czy COST w trybie left/top robi się czerwony sam z siebie.
4. **Wiążące pliki:** MOTION.md i PLAN.md bez zmian. COPY.md: klucze `nojs`, `toggle`, `pause`, `play`, `reverse`, `copy`, `top`, `link`, `colophon`, sekcja `sources`.
5. **Następna faza:** P4 (bramki jakości: układ, wydajność, dostępność, Exit Check, code review, README, FINGERPRINT).
