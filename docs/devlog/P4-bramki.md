# P4 · Bramki jakości, telefon, przygotowanie do wdrożenia (29.10.2026)

Model: Fable 5.1, effort medium. Czas sesji: ok. 1 h 50 min.
Skille obowiązkowe: `taste-guardrail` (Exit Check), `a11y-gate` (+ `references/wcag-aa-checklist.md`), `react-next-perf`, `code-reviewer` (tryb full-review na `src/` i `tests/` od pierwszego commita), `animaxxing/verification.md` jako lista kontrolna ruchu. Wyniki niżej, liczby przed/po tam, gdzie coś zmieniłem.

## Q1 · Układ

Test: `layout.spec` (7 szerokości: 360, 390, 768, 1024, 1280, 1440, 1920): boot i intro hero (~385 klatek), hover i focus 6 słów + Replay, każdy rozdział po cięciu w trakcie intro (POSITION, EASE, STAGGER, REVERSE ~331–367 klatek; COST z przełączeniem trybu i YOURS z Play ~151), SCRUB w trakcie przewijania przez przypięty zakres (~205 klatek). Nowy `interactive.spec` (1440 i 390): hover i focus **każdego** elementu interaktywnego w każdym rozdziale (hero 7, POSITION 1, EASE 5, STAGGER 1, SCRUB 1, REVERSE 1, COST 2, YOURS 8 = 26 kontrolek), zrzut boxów przed i po.

**Wynik: 0 przesunięć** w każdym przypadku (boxy względem sekcji, bez własnej translacji, EPS 0.01 px < 1/64 px jednostki układu). Brak poziomego scrolla na żadnej szerokości (`scrollWidth ≤ clientWidth`).

## Q2 · Wydajność

Metoda: `perf.spec` (fps, LCP, CLS, JS, długie klatki) w osobnym projekcie Playwrighta `perf`, w jednym pliku w trybie serial, który zależy od `chromium` i rusza dopiero po reszcie (równoległe workery fałszowały LCP: 6268–6540 ms vs 504 ms samemu). rAF co klatkę, CDP `Emulation.setCPUThrottlingRate 4`.

| Pomiar | Wynik |
|---|---|
| FCP / LCP (localhost, zimne wejście, 1440) | FCP 120 ms. LCP: 120 ms (kandydat `span.t` „Sequence,", 69 269 px²) w runie końcowym; w innych runach 504 ms, a pod obciążeniem 5.4–6.5 s, bo Chromium dokłada kandydatów, gdy kolejne słowa zdania hero są malowane (zdanie gra ~5 s). Bramka testowa: FCP < 1 s i pierwszy kandydat LCP < 2.5 s; wartość końcowa do raportu, nie do bramki. |
| CLS | 0.0000 |
| JS strony | 8 chunków, 716 KB raw / 231 KB gzip; z tego React + Next runtime ≈ 545 KB raw, gsap + ScrollTrigger + SplitText ≈ 129 KB, kod ruchu strony ≈ 33 KB; HTML 63 KB (9.8 KB gzip); CSS 10.5 KB |
| fps przy 4× CPU | hero 59.6 · POSITION 60.2 · EASE 60.1 · STAGGER 60.2 (16×7) · SCRUB 60.3 · REVERSE 60.2 · COST 60.2 · YOURS 60.2 |
| długie klatki > 50 ms przy 4× CPU | **przed:** hero 1 (115 ms); reszta 0. **po:** hero 1 (68 ms); reszta 0 |
| COST | 1×: 16.7 / 16.7 ms; 12× CPU: transform 16.5, left/top 32 ms (czerwień), powrót mięta (celowy jank, poza raportem) |

**LCP a hero, który gra:** gsap-nextjs ostrzega, że LCP to nie koniec timeline'u; tu zdanie hero jest największym tekstem w kadrze i maluje się słowo po słowie, więc „ostatni kandydat" może wypaść na 5 s, choć pierwszy tekst jest na ekranie po 120 ms, a pierwsze pełne słowo po ~1.9 s. Jeśli LCP w polu (CrUX) ma być bramką wdrożenia, jedyna uczciwa zmiana to krótsze zdanie hero albo wolniejsze dochodzenie kolejnych słów przed pierwszym; nie zmieniam tego bez decyzji Piotrka.

**Co zmieniłem:** rozdziały pod kadrem oddają bramkę pierwszej klatki od razu i budują intro o kolejne klatki później (`yieldFrames` w `chapter.ts`; pin SCRUB o 6 klatek); jedna długa klatka startu spadła z 115 do 68 ms przy 4× (≈ 17 ms przy 1×): to hydracja + split zdania hero przed zdjęciem bramki, czyli koszt pierwszej widocznej klatki, nie ruchu. Test dopuszcza ≤ 1 długą klatkę w hero, 0 w trakcie ruchu.

**react-next-perf (kolejność: waterfalle → bundle → fetching → render → memo):**
- Waterfalle: brak (strona statyczna, `fs` tylko w czasie builda).
- Bundle: `"use client"` tylko na liściach (`MotionBoot`, `*Motion`, `Cuts`, `Playhead` SSR). Jedyny kandydat do cięcia to React/Next runtime (545 KB raw), czyli koszt frameworka, nie strony; gsap 129 KB jest potrzebny na pierwszej klatce (opener, hero), więc `next/dynamic` tylko odwlekłby bramkę. Nie ruszone.
- Fetching: n/d. Render: brak stanu React; motion poza Reactem. Memo: brak, nie trzeba.

## Q3 · Dostępność (a11y-gate)

| Bramka | Werdykt | Dowód |
|---|---|---|
| Kontrast (1.4.3 / 1.4.11) | PASS | `contrast.spec`: 8 par display 3.96–12.57, body ≥ 4.99 (YOURS body w mięcie 9.36), jank 3.31 tylko display (body ukryte w jank). |
| Klawiatura (2.1.1 / 2.4.3) | PASS | `a11y.spec`: 35 elementów w kolejności dokumentu: hero 6 słów + Replay → głowica POSITION → głowica EASE + 4 przyciski → STAGGER → SCRUB → REVERSE → COST 2 przyciski → YOURS 5 pól + 3 przyciski → 9 linków źródeł. Zero przeskoków wstecz. |
| Widoczny focus (2.4.7 / 2.4.11) | PASS | Każdy element: outline ≥ 2 px w kolorze `--fg` rozdziału (głowica: outline na hairline). Element z focusem zawsze w kadrze. |
| Semantyka (1.3.1 / 4.1.2) | PASS | 1 × h1 (zdanie), 7 × h2 (słowa rozdziałów), bez h3; `main` + `footer`; każda sekcja z `aria-label`; siatka STAGGER i duchy EASE `aria-hidden`, h2 z `aria-label` słowa. |
| Formularze (3.3.2 / 4.1.2) | PASS | 5 pól YOURS w `label`, status `role="status" aria-live="polite"`, walidacja z komunikatem, `noValidate` (walidacja własna). |
| Obrazy i media | n/d | Brak obrazów; nagrania tylko w docs. |
| Ruch (2.3.1 / 2.3.3 / 2.2.2) | PASS | Opener ≤ 1 zmiana/s w każdym z 3 punktów (`opener.spec`); reduced motion = spoczynek wszędzie (`reduced.spec`); orbita COST z pauzą i tylko w kadrze. |
| Treść dynamiczna (4.1.3 / 2.5.8) | PASS | Liczba ms bez `aria-live` (zmiana 8×/s byłaby hałasem; wartość do odczytu po fokusie na rozdziale); głowica 24 px pola chwytu; dotyk nie zostawia hovera (`a11y.spec`, tap na słowie hero: `fontStretch` wraca, box zwolniony). |

Niezaliczone: brak. Uwaga (nie bramka): „Skip to content" nie ma sensu bez nawigacji (treść zaczyna się od h1). Słowa hero bez JS mają `tabindex=-1` (nic nie robią), z JS wracają do kolejki.

## Q4 · Taste-guardrail Exit Check (klatki `docs/media/p4/`, 1440 i 390)

Lock ✓ · font nie z banned listy ✓ · jeden akcent + pole (płaski druk, celowo bez „głębi tła") ✓ · asymetria ✓ (każdy rozdział inne położenie słowa) · sygnaturowy detal: cięcie przez literę ✓ · hierarchia: jeden focal point na kadr ✓ · Tells: żaden (brak Inter/gradientów/kart/wyśrodkowanych stosów/emoji/zaokrągleń) ✓ · kontekst (nie pasuje do innej firmy) ✓ · warm/analog: riso-flat ✓ · izolacja ✓ · grupowanie: podpis przy swoim słowie, kod przy swojej linijce ✓ · głębia: n/d dla płaskiego druku ✗ (formalnie) · napięcie: YOURS cięte dołem, STAGGER siatka do krawędzi ✓.

**Wynik 12/13** (≥ 12, więc bez obowiązkowych poprawek). **Test kostiumu:** bez rekwizytów spoza PLAN §4. Trzy rzeczy do rozważenia (nie poprawki wymagane progiem):
1. SCRUB na starcie pinu stoi w wght 100 / wdth 50: na 390 px to włosowe kreski (klatka `04-scrub-390`). Wartości są z MOTION.md; propozycja: start od wght 200, jeśli na telefonie nieczytelne.
2. EASE na 390: przebieg 193 px, kontur duchów robi gęstą fakturę; alternatywa: kopie 52 px.
3. Hairline głowicy w 5 rozdziałach przy prawej krawędzi może się czytać jako ramka; sprawdzić z ręki.

## Q5 · Code review (code-reviewer, full-review `src/` + `tests/`, 73 pliki, +5063/−278)

**Verdict: ✅ APPROVE** z follow-upami. Jakość 7/10: jeden rdzeń ruchu, buildery nie decydują kiedy grają, każdy stan ma test w przeglądarce; smaki: kilka długich funkcji, timing w testach, trochę martwego kodu.

Poprawione w P4 (krytyczne i tanie):
- `[HIGH]` `playhead.ts`: nieczytelny ternary dla bazy strzałki → jawna `base` z komentarzem.
- `[MEDIUM]` `cost.ts`: martwy parametr `now` w `orbit()`.
- `[MEDIUM]` `tests/harness.ts`: `snapshotBoxes` wymagało rekordera z init scriptu (`__layoutBox is not a function` w nowym `interactive.spec`) → `ensureKeys`.
- `[MEDIUM]` `playwright.config.ts`: pomiary w osobnym projekcie z `dependencies`, żeby nie biegły równolegle z resztą.

Do follow-upu (wypisane, nie zrobione):
- `[MEDIUM]` `chapter.ts`: `ready` doklejane przez rzutowanie `(controller as { ready })`; czyściej zbudować obiekt po `prepare()`. Funkcja `createChapter` 200+ linii: wydzielić `createTrigger` i `prepare`.
- `[MEDIUM]` `position.ts` / `PositionMotion`: `positionOutro` (kod wychodzi w górę) nigdy nie jest widoczny, bo cięcie wstecz skacze natychmiast; albo podpiąć pod `outroOnLeaveBack`, albo usunąć.
- `[MEDIUM]` `cuts.ts` `createCuts`: koordynator + pętla + link „Back to the top" w jednej funkcji (90 linii) → `createCoordinator(cuts)` i `createLoop()`.
- `[MEDIUM]` Testy: dużo `waitForTimeout` opartych na czasie intro (6.5 s, 5.6 s); bezpieczniej `waitForFunction(data-phase === "rest")`. Dziś stabilne, ale wolne (pełny run 4.2 min).
- `[NIT]` `hero.ts`: kadencje 0.12 / 0.045 / 0.05 jako literały; `MOTION.md` ma tabelę staggerów, warto nazwać stałe.
- `[NIT]` `copy.ts`: rzut `current as unknown as Record<string,string>`; typ z indeksem byłby jawny.
- `[NIT]` `register.ts`: `__otScrollTrigger` na `window` zostaje jako diagnostyka; oznaczyć w CLAUDE.md, żeby nikt na tym nie budował.

Dobre rzeczy: jedna paleta w jednym miejscu z testem kontrastów liczonym wzorem; buildery zwracają timeline w pauzie, kontroler decyduje; każda decyzja ma pomiar w devlogu; harness mierzy to, co widzi użytkownik (względem sekcji, w kadrze, bez transformów); testy opisują zachowanie („the dot grows into the plum field…"), nie implementację.

Pokrycie: wszystkie fazy P0–P3 mają testy w przeglądarce; brak testów jednostkowych czystych funkcji (`clampValues`, `formatTime`, parser COPY) → kandydat na Vitest albo małe pliki w Playwright bez przeglądarki (jak `contrast.spec`).

## Q6 · README i FINGERPRINT

`README.md` (co to jest, uruchomienie, testy, gdzie są MOTION.md i PLAN, zasady), `docs/FINGERPRINT.md` (gramatyka, sygnatura, paleta, rozdziały, elementy stałe, inżynieria, czego nie powtarzać) do przeniesienia do `atelier/`.

## animaxxing `verification.md` jako lista kontrolna ruchu

- Linie nie przeskakują w trakcie splitu: box słowa trzymany, 0 przesunięć (Q1) ✓.
- Splity rewertowane przy spoczynku (`.ch` = 0 po intro, test playhead/hero) ✓; żaden `transform`/`will-change` nie zostaje na elementach w spoczynku poza celowym `will-change` liter COST w kadrze ✓.
- Reduced motion: spoczynek, callbacki (`data-phase="rest"`) ✓. Hover ↔ focus współdzielą stan; dotyk nie zostaje gorący ✓.
- Pinned scene bez skoku przy wejściu i wyjściu (`anticipatePin: 1`, layout 0 przesunięć w SCRUB) ✓. Reload w środku strony: rozdziały bez autoplay stają w spoczynku ✓.
- Pętla dłuższa niż 5 s (orbita COST) ma pauzę ✓.

## Pomiary końcowe

`npm run lint` 0 · `npx tsc --noEmit` 0 · `npm run build` 0 · `npm test`: 43 passed, 16 skipped (shots), 4.4 min (projekt `chromium`, potem `perf` serial) · `npm run shots p4`: 16 PNG spoczynku + 2 nagrania całej strony (`full-page-1440.webm` 10.9 MB, `full-page-390.webm` 3.8 MB; pierwsza wersja skryptu kręciła się 4 min, bo pętla przewija dokument na górę: teraz nagranie kończy się po odegraniu pętli).

## Pięć linijek

1. **Do decyzji:** wdrożenie (Vercel albo VPS). Repo jest gotowe: `next build` statyczny, zero env, zero backendu. Vercel: `vercel --prod` z katalogu; VPS: `npm run build && npm run start -p 3000` za reverse proxy.
2. **Lista rzeczy do sprawdzenia na telefonie (30 min, z ręki):** opener (paski → róż), zdanie hero (występ czy animacja), cięcie kropką, głowica POSITION palcem, EASE przyciski i kontur duchów, STAGGER 8×7, SCRUB pod kciukiem (start wght 100: czytelne?), REVERSE różnica wierszy, COST: czy `left / top` robi czerwień na telefonie, YOURS formularz i Play, pętla na końcu, `Back to the top`, strona z wyłączonym JS (Safari: Ustawienia → Safari → Zaawansowane → JavaScript) i z „Ogranicz ruch".
3. **Co pominąłem:** nic z Q1–Q6; follow-upy z code review wypisane, nie zrobione.
4. **Wiążące pliki:** MOTION.md, PLAN.md bez zmian w P4.
5. **Werdykty bramek P1–P3** dalej czekają na wpis Piotrka w devlogach. v6 do SPALONE w karcie projektu po P4.

## Follow-upy po P4 (29.10.2026, druga sesja)

Piotrek: „jeśli coś zostało, to działaj dalej". Zostały follow-upy z Q5; zrobione wszystkie poza zmianami ruchu (trzy rzeczy z Exit Checku czekają na werdykt z telefonu, bo dotykają wartości z MOTION.md).

- `chapter.ts`: `ready` to getter nad zmienną ustawianą po `prepare()`, bez rzutowania. Wydzielone `ensureIntro()` (wspólne dla `seek` i `goTo`), `createTrigger()` i `settleFromViewport()`; `prepare()` ma 14 linii. Zachowanie bez zmian (layout, playhead, ease, chain zielone).
- `cuts.ts`: `createCoordinator(cuts)` (nasłuch scrolla + rAF + reguła „najdalsze w dół, najbliższe w górę"), `createChapterCut(spec)` i `createLoop()` z linkiem „Back to the top"; `createCuts` to 14 linii składania. `cutLetter()` zamiast dwóch identycznych domknięć.
- `position.ts`: usunięte martwe `positionOutro` (cięcie wstecz skacze pod zakryciem, wyjście nigdy nie było widoczne); `PositionMotion` i `motion/index.ts` bez eksportu. Cykl outro → end w kontrolerze zostaje jako API.
- `hero.ts`: kadencje nazwane w `CADENCE` z komentarzem, skąd wartości. Uczciwie: overlap 0.045 i stagger/reverse 0.05 s / znak są nad górną granicą tabeli MOTION.md (0.04), a sequence 0.12 trzykrotnie nad nią. Strojone w P1 na żywo, nie ruszam bez werdyktu; jeśli zostają, tabela staggerów w MOTION.md powinna dostać wyjątek dla hero.
- `copy.ts`: `ScalarKey` z typu `ChapterCopy` + type guard zamiast `as unknown as Record<string,string>`; nieznany klucz nadal rzuca. `parseCopy` wyeksportowany dla testów.
- `format.ts`: zaokrąglenie setnych przenosi się przez sekundy i minuty (stary kod dawał `0:60.00` dla 59.996; znalezione przy pisaniu testu, w praktyce nieosiągalne, znaczniki hero < 4 s).
- `CLAUDE.md`: `window.__otScrollTrigger` oznaczone jako diagnostyka.
- Testy: `waitForRest(page, id)` i `waitForIntro` w harnessie (ścisłe `data-phase`), zamiast `waitForTimeout(6500 / 6800 / 5600 / 7000)` w `layout`, `interactive`, `a11y`, `loop`, `perf`. Rekorder układu zatrzymuje poprzedni przed startem nowego (wcześniej dwa okna mogły dopisywać do jednej listy). `cutTo` zostaje łagodne dla rozdziałów bez kontrolera (SCRUB, COST, YOURS). Pełny run 4.4 → 3.5 min.
- `tests/unit.spec.ts`: 10 testów czystych funkcji bez przeglądarki (`clampValues`, `codeLine`, `formatTime`, `parseCopy` + realny `docs/COPY.md`).

Pomiary: lint 0 · tsc 0 · build 0 · `npm test` 53 passed, 16 skipped (shots), 3.5 min · perf bez zmian (FCP 120 ms, CLS 0, 60 fps przy 4×, hero 1 długa klatka 77 ms na starcie).
