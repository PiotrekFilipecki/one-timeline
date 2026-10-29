# P2 · EASE, STAGGER, SCRUB, REVERSE i cięcia (29.10.2026)

Model: Fable 5.1, effort medium. Czas sesji: ok. 2 h 30 min (build ≈ 1 h, debug cięć i pinu ≈ 1 h, media i devlog ≈ 30 min).
Wzorzec z P1 (kontroler, głowica, cięcie) rozrolowany na cztery pojęcia; bramka kierunku P1 czeka na ocenę Piotrka, praca szła dalej na jego życzenie.

## Skille: co wybrałem i dlaczego

| Skill | Użyty do | Co wziąłem |
|---|---|---|
| `animaxxing` (`split-entrances`, `scroll-effects` → `pinnedScene`, `text-stability`) | reverse.ts, scrub.ts, split.ts | Wzorzec przypiętej sceny (`pin`, `scrub`, `anticipatePin`), maska zza krawędzi przez `clip-path`, box słowa trzymany przez cały split (teraz także dla bloków). |
| `design-motion:gsap-timeline` | ease.ts, stagger.ts, reverse.ts | Labele jako punkty dla przycisków (`tweenTo`), `tweenFromTo` nested timeline'ów, żeby odwrotne odtworzenie było realne i scrubowalne jedną osią. |
| `gsap-scrolltrigger` | scrub.ts | `pin: true, scrub: 0.6, invalidateOnRefresh`, `onUpdate` → `data-scrub` dla testów. Dla cięć ScrollTrigger porzucony (decyzja 3). |
| `gsap-performance` | stagger.ts, perf.spec | Jeden tween ze `stagger.grid` na przejście zamiast 112 tweenów; `will-change: transform` na komórkach; pomiar fps przy 4× CPU zamiast zgadywania budżetu. |
| `motion-design` | ease.ts, stagger.ts | Komórki rosną z podstawy (scaleY), kopie przelatują na `beat`, cięcie między układami zamiast przenikania. |
| `taste-guardrail` (Exit Check + test kostiumu) | niżej | |

## Co powstało (E1–E7)

- **E1 EASE.** Onion skin: 12 kopii słowa, pozycja kopii i = `parseEase(e)(i/11)` × (szerokość sceny − szerokość kopii). Bez wykresu. Spoczynek = `expo.out` policzony na serwerze (`--p`), rysowany czystym CSS: `translateX(calc(var(--p) * (100cqw - 100%)))` z container query units, więc krzywa istnieje bez JS. Aktor (h2) to ostatnia kopia (lądowanie krzywej), 11 duchów konturem `-webkit-text-stroke` w tej samej farbie (dwie farby zostają). Intro: stos → none → power2.inOut → back.out(1.7) → expo.out na `beat` (0.6 s, stagger 0.02 s po kopii), głowica przez całość. Cztery przyciski mono (`aria-pressed`), kopie przelatują osobnym tweenem po `rest()` (jeden właściciel transformu).
- **E2 STAGGER.** Słowo z siatki liter: 16×7 na desktopie, 8×7 na telefonie (CSS chowa komórki 57+; builder czyta liczbę kolumn z computed `grid-template-columns`). Trzy przejścia głowicy: `from: "center"`, `"edges"`, `"random"`; każde = `set(scaleY 0)` + jeden tween `stagger: { grid: [7, 16], from, amount: 0.9 }`. Nagłówek czyta się jako jedno słowo (`aria-label`), komórki są `aria-hidden`.
- **E3 SCRUB.** Jedyny rozdział na scrollu: sekcja przypięta na jeden kadr, litery `fontStretch` 50 → 150 % i `fontWeight` 100 → 900, `scrub: 0.6`. Litery przypięte do najszerszego stanu (150 / 900), box słowa rozciągnięty na scenę i centrowany, zero reflow sąsiadów (layout.spec w trakcie przewijania: 0). Głowica pokazuje progress scrolla i przeciągana przewija dokument. Reduced motion: bez pinu i splitu, CSS = środek osi (wdth 100, wght 500).
- **E4 REVERSE.** Dwa wiersze, dwie prawdziwe nested timeline'y: A `fromTo(yPercent 110 → 0, expo.out, stagger 0.03)`, B to samo z `easeReverse: true`. Chapter timeline prowadzi je przez `tweenFromTo(0, d)`, `tweenFromTo(d, 0)` (cofanie: A pełznie jak expo.in, B zachowuje expo.out) i znowu `(0, d)` do spoczynku. Głowica wraca w lewo podczas cofania. Sprawdzone w Node: `easeReverse` działa na tweenie i przez `defaults`, nie na `gsap.timeline({ easeReverse })`; przez `tweenFromTo` też działa (x przy połowie cofania: 2.3 vs 97.7).
- **E5 Cięcia.** Jedna konfiguracja `src/motion/cuts.ts`, jedno koło na stronę, kolor ustawiany `set()` z palety następnego rozdziału. Litera tnąca per rozdział (wybór i powód niżej). Litery mierzone przez `Range` na węzłach tekstowych, więc działają na tekście w spoczynku i w trakcie splitu.
- **E6 Reduced motion.** EASE: układ expo.out (CSS). STAGGER: pełne słowo. SCRUB: stan środkowy, bez pinu. REVERSE: oba wiersze w spoczynku. Test `reduced.spec` to sprawdza.
- **E7 Testy.** `layout.spec` (7 szerokości): hero + hover/focus + każdy rozdział P2 w trakcie intro po cięciu + SCRUB w trakcie przewijania przez przypięty zakres. `chain.spec`: każde cięcie ląduje na kolorze typografii poprzedniego, następny rozdział gra i staje, SCRUB dojeżdża do 150 %, 6 odegrań. `ease.spec`: pozycje kopii vs `gsap.parseEase` (tolerancja 1 px): w spoczynku z CSS i po każdym przycisku, odchyłka 0.000 px. `perf.spec`: fps przy 4× CPU.

## Litera tnąca per rozdział

| Cięcie | Litera | Dlaczego |
|---|---|---|
| hero → POSITION | kropka zdania | Koniec zdania = początek rozdziału; sygnatura z PLAN. |
| POSITION → EASE | „O" z OVERLAP | Okrągła, lewy dół dyptyku: koło rośnie z litery, która już jest kołem. |
| EASE → STAGGER | ostatnie „E" aktora | Punkt, w którym krzywa expo.out ląduje (prawa krawędź). |
| STAGGER → SCRUB | ostatnia komórka siatki | Prawy dolny róg: tam kończy się ostatni stagger. |
| SCRUB → REVERSE | „B" | Ostatnia litera słowa, które właśnie dojechało do 150 %. |
| REVERSE → COST | „R" wiersza B | Początek wiersza z `easeReverse`, czyli ten, który „wychodzi uczciwie". |

## Decyzje i lekcje

1. **GSAP liczy easingi także na serwerze.** Replika `expo.out` (1 − 2^(−10t)) różniła się od GSAP o 0.3–0.8 % (GSAP ma własną, zmodyfikowaną krzywą), czyli 6 px na kadrze. `src/lib/eases.ts` importuje `gsap` tylko do `parseEase` (liczby, zero animacji); wyjątek zapisany w CLAUDE.md. Odchyłka 0.000 px.
2. **Pin-spacer psuje `offsetTop`.** ScrollTrigger owija przypiętą sekcję w `position: relative` spacer, więc `offsetTop` SCRUB = 0, a skok dokumentu lądował na górze strony. Wszędzie `getBoundingClientRect().top + scrollY` (`docTop`), także w testach.
3. **Cięcia bez ScrollTriggera.** Triggery cięć utworzone przed pinem miały progi o 100 vh za wcześnie i `ScrollTrigger.refresh()` ich nie przeliczał (sprawdzone na `__otScrollTrigger.getAll()`: `cut:reverse@3780`, gdy REVERSE stoi na 5400). Koordynator w `cuts.ts`: jeden nasłuch scrolla, progi z `getBoundingClientRect`. Bonus: przy skoku przez kilka progów gra tylko najdalsze cięcie, wcześniejsze przechodzą cicho (`pass`), w górę gra tylko najbliższe (`unpass` dalszych). Wcześniej skok z hero do STAGGER uruchamiał naraz cięcia EASE i STAGGER, które walczyły o jedno koło i pozycję dokumentu.
4. **Harness liczy boxy względem sekcji.** Przypięta sekcja porusza się względem dokumentu z definicji, a CLS liczy elementy w kadrze: box = rect − rect sekcji − własna translacja, tylko elementy w kadrze. Dzięki temu „0 przesunięć w trakcie SCRUB" jest mierzalne.
5. **Box słowa trzymany także dla bloków.** W kolumnie flex z `align-items: flex-end` (REVERSE) blok ma szerokość treści; split zmieniał ją o 1–3 jednostki układu. `splitLetters` trzyma szerokość każdego celu. Dla SCRUB box musi być rozciągnięty na scenę (`text-align: center`), bo litery przypięte do 150 % potrzebują miejsca w każdym stanie.
6. **Kerning duchów = kerning aktora.** `[data-split]` ma `font-kerning: none`; duchy bez tego były o 11 px węższe i aktor lądował 11 px za wcześnie. `.onion .word` ma tę samą typografię.
7. **Siatka: 16×7 wszędzie by przeszło** (60 fps na telefonie przy 4× CPU), ale 8×7 na 390 px daje czytelne 11 vw litery zamiast 22 px. Decyzja po pomiarze: telefon 8×7.
8. **`data-grid` na sekcji kolidowało z `[data-grid]` siatki** (debug mierzył sekcję jako siatkę o 1 kolumnie). Atrybut stanu na sekcji to `data-grid-size`. Ta sama lekcja co `data-opener` w P1: atrybuty stanu nigdy nie mogą dzielić nazwy z selektorami elementów.

## Pomiary

- `npm run lint` 0 · `npx tsc --noEmit` 0 · `npm run build` 0 · `npm test`: 31 passed, 10 skipped (shots), 2.2 min · `npm run shots p2`: 6 passed, 46 PNG + 2 webm.
- **Układ (layout.spec):** na każdej z 7 szerokości: hero ~385 klatek, 0 przesunięć; hover/focus × 6 + Replay: 0; POSITION, EASE, STAGGER po ~331 klatek, 0; SCRUB ~205 klatek w trakcie przewijania przez przypięty zakres, 0; REVERSE ~365 klatek, 0. Brak poziomego scrolla.
- **fps przy 4× CPU (perf.spec, CDP `Emulation.setCPUThrottlingRate 4`, rAF co klatkę):**

| | STAGGER (siatka) | SCRUB (przewijanie) |
|---|---|---|
| desktop 1440, 16×7 | 60.1 fps, 0/211 długich klatek (> 50 ms), najgorsza 20 ms | 59.8 fps, 0/132, najgorsza 31 ms |
| telefon 390, 8×7 | 60.1 fps, 0/211, najgorsza 19 ms | 60.2 fps, 0/133, najgorsza 26 ms |

- **Łańcuch (chain.spec):** hero → POSITION `#4A0D3A` → EASE `#C6FF1A` → STAGGER `#2B1BFF` → SCRUB `#FFE500` → REVERSE `#6A1BFF` → COST `#A8F5CF`; każdy = typografia poprzedniego; `data-cut-plays` = 6; SCRUB progress 1.0, pierwsza litera `font-stretch: 150%`.
- **EASE vs parseEase:** przebieg 851.3 px, najgorsza odchyłka 0.000 px w spoczynku (CSS) i po każdym z 4 przycisków.
- **SCRUB w stanie końcowym (1440):** glify 1281 px, w kadrze (wcześniej 18vw wystawało 195 px za prawą krawędź).

## Klatki i nagrania (docs/media/p2, obejrzane)

- `ease-mid`: układ power2.inOut, kopie symetrycznie zagęszczone na końcach, hairline w 1/3. Konturowe duchy robią „hatch" tam, gdzie krzywa jest gęsta: gęstość czyta się bez osi i bez wykresu. 390: kopie ciasne (przebieg 193 px), ale cztery układy dalej rozróżnialne.
- `stagger-mid`: przejście „edges": romb z zewnątrz, komórki w locie squashowane. 390 (8×7): to samo, czytelne.
- `scrub-mid` / `scrub-end`: środek osi ze spacjowanymi literami (boxy przypięte do 150 %), koniec: wdth 150 / wght 900 w kadrze. Spacjowanie w stanie wąskim to koszt reguły MOTION.md (przypinanie do najszerszego stanu); czyta się jako „słowo się ściąga", nie jako błąd.
- `reverse-mid`: wiersz A w połowie cofania, litery na schodku (stagger wstecz), wiersz B już w masce: różnica expo.in vs expo.out widoczna w jednej klatce.
- `cut-*-50`: koła rosną z O (lewy dół), E (prawy), ostatniej komórki (prawy dół), B, R (lewy). Trzy kolory w każdej klatce cięcia.
- `hero-to-mint-1440.webm` (28 s) i 390: całe przewinięcie od hero do pola mięty, z pauzami na intro rozdziałów (skrypt kółka czeka, gdy cięcie albo intro trwa).

**Exit Check (taste-guardrail, 11/13):** jak w P1: Lock ✓ · font ✓ · akcent + pole ✓ · asymetria ✓ (EASE na dole, STAGGER siatka, SCRUB środek, REVERSE prawa) · sygnatura ✓ · hierarchia ✓ · Tells ✗ żaden · kontekst ✓ · warm/analog ✓ · izolacja ✓ · grupowanie ✓ · głębia n/d ✗ · napięcie ✓ (SCRUB dojeżdża do krawędzi, STAGGER siatka bez marginesu na 390).

**Test kostiumu:** czy któryś rozdział dorzuca rekwizyt spoza PLAN §4? EASE: kontur duchów to decyzja renderowania kopii (PLAN: „12 kopii"), nie nowy element; przyciski są w PLAN („4 easingi przełączane"). STAGGER: siatka w PLAN. SCRUB: nic poza słowem i głowicą. REVERSE: nic. Werdykt: bez kostiumu. Ryzyko: kontur duchów przy gęstym układzie robi fakturę („hatch"), która może wyglądać na trzeci kolor z daleka; na telefonie do sprawdzenia.

## Poza zakresem, do rozważenia

- EASE na 390: kopie 64 px min, przebieg 193 px: układy `back.out` i `expo.out` są bliskie; można zmniejszyć kopie do 52 px.
- SCRUB: spacjowanie liter w stanie wąskim można zmniejszyć, przypinając do 125 % i zatrzymując rozciąganie na 125 (strata zakresu osi). Nie zrobione: MOTION.md mówi 50 → 150.
- Opener i głowice: po P2 głowica jest w 5 rozdziałach; wspólny wzorzec „pokaż hairline przy prawej krawędzi w spoczynku" trzyma spójność, ale warto sprawdzić z ręki, czy nie czyta się jako ramka.
- `cacheComponents: true` dalej bez znaczenia; `__otScrollTrigger` na `window` zostaje jako diagnostyka (tylko odczyt).

## Pięć linijek

1. **Jak zobaczyć:** `npm run dev -- -H 0.0.0.0` + `ipconfig getifaddr en0`; przewijanie od hero do pola mięty. Nagrania: `docs/media/p2/hero-to-mint-*.webm`.
2. **Co pominąłem:** nic z zakresu E1–E7.
3. **Co ręcznie:** bramka P1 (werdykt do `docs/devlog/P1-hero.md`) i bramka P2: przewinięcie hero → mięta na telefonie bez zacięć; czy każdy rozdział da się zrozumieć bez czytania podpisu.
4. **Wiążące pliki:** MOTION.md i PLAN.md bez zmian. CLAUDE.md: wyjątek `src/lib/eases.ts` (parseEase na serwerze). COPY.md: kod REVERSE poprawiony na realne API (`easeReverse` na tweenie).
5. **Następna faza:** P3 (COST, YOURS, pętla, bez JS i reduced motion dla całej strony, źródła i kolofon).
