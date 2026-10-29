# P5b · v7.1: blob-bohater i dekoracje SVG (29.10.2026)

Model: Fable 5.1. Drugi PR v7.1 (`v7.1/blob`, na gałęzi PR-a 1). Skille: `animaxxing` (svg-effects: drawIn, morph, followPath; ambient), `gsap-nextjs`, `design-motion:gsap-plugins` (DrawSVG, MorphSVG, MotionPath, darmowe od 3.13). Prośba Piotrka: „jakiś ciekawy blob, co się morfuje" i „blob też niech ma jakąś teksturę czy pattern, które się animują przy zmianach".

## Bohater

- `src/lib/blob.ts`: osiem ścieżek w boxie 200×200 (`base` kropla, `ticket`, `ball`, `domino`, `snail`, `flame`, `burst`), kształt spoczynku per rozdział, krzywa EASE (`easeCurvePath`, 1000×400, y = 340 − ease·280), spirala ślimaka, parser znaczników hero.
- `Blob.tsx` (SSR): `<svg data-blob>` z `<pattern>` rastru (kropki 2.4 w siatce 12, obrót 30°) w farbie typografii i ścieżką kształtu spoczynku. Bez JS i przy reduced motion: stoi. Dwie farby zostają (pattern = kropki `--fg` na `--bg`).
- `src/motion/blob.ts`: `blobMorph` (fromTo z `morphSVG`, więc kropla renderuje się od razu w przygotowaniu, a morf idzie w timeline'ie intro: głowica go scrubuje), `patternPulse` (pattern robi pełny obrót i puchnie ×1.4 w trakcie zmiany, kropki 2.4 → 3.6 → 2.4; na końcu stan jak z SSR), `blobTo` (morf poza intro), `blobRevert` (spoczynek jak z serwera), `blobBreathe` (oddech hero, 1.7 s ruchu i 2.4 s pauzy).

## Rozdział po rozdziale

| Rozdział | Blob | Dekoracja |
|---|---|---|
| hero | kropla wyrasta z podstawy po zdaniu (jedyny `back.out(2.2)` na ekranie), w spoczynku oddycha | linijka master timeline'u: kreska rysuje się w czasie rzeczywistym zdania (DrawSVG, ease none), ticki wyrastają na znacznikach, głowica jedzie |
| POSITION | kropla → bilet z nacięciami, wchodzi łukiem z prawej na lewo (MotionPath, `curviness 1.3`) w chwili, gdy dolny rząd nachodzi na górny | |
| EASE | kulka jedzie po krzywej: x liniowo (czas), y z easingiem przelotu (wartość), pattern pulsuje | krzywa rysuje się kreską jako linia (`none`), morfuje do każdego easingu 0.35 s przed przelotem; przyciski morfują ją i puszczają kulkę |
| STAGGER | kropla → domino, przewraca się pierwsze w każdym przejściu | cztery duchy domina (kreska przerywana) przewracają się za nim ze staggerem 0.09, wszystkie wstają na `back.out(1.4)` |
| SCRUB | jog wheel: kula ze znacznikiem, pełny obrót na przypięty zakres (w timeline'ie scruba) | |
| REVERSE | kropla → ślimak; przy cofaniu pełznie w lewo na `expo.in` (jak wiersz A), wraca na `expo.out` | muszla rysuje się spiralą (DrawSVG) |
| COST | pattern kręci się w rytm kosztu klatki (`timeScale` = ms / 16.7, 0.5–4); po budżecie morfuje w płomień | |
| YOURS | Play: wybuch i powrót na `elastic.out(1, 0.45)` + obrót o 3× Twoją rotację Twoim easingiem; Reverse cofa obrót; Copy: błysk patternu | |

## Decyzje i lekcje

- **SVG i clearProps.** `clearProps: "transform"` na elemencie SVG kasuje atrybut `transform`, więc duchy domina (translate z SSR) i głowica linijki wracają przez `gsap.set({ rotation: 0 })` / `{ x: 1000 }`, nie przez clearProps. Blob w EASE dostaje atrybut `translate(1000 60)` z powrotem po revercie.
- **MorphSVG + DrawSVG na jednej ścieżce.** DrawSVG ustawia `stroke-dasharray` z długości; morf zmienia długość i kreska byłaby „niedorysowana". Po narysowaniu `clearProps: strokeDasharray,strokeDashoffset`, dopiero potem morfy.
- **Kulka EASE bez MotionPath.** Krzywa to y = ease(x) przy x liniowym, więc kulka jedzie dwoma tweenami: x `none`, y tym samym easingiem. MotionPath po długości ścieżki rozjeżdżałby się z kopiami (które lecą na beat do pozycji z easingu). MotionPath zostaje w POSITION (łuk biletu).
- **Wrapper smoothera: `overflow: clip !important`.** `hidden` jest przewijalny programowo: klik Playwrighta (actionability) i `scrollIntoView` przewijały wrapper zamiast okna i fałszowały każdy pomiar rect (cięcie do YOURS gubiło próg na 1920 px, dwa runy z rzędu; diagnostyka w `cutTo` pokazała `yours=before` przy pozycji tuż za progiem). `clip` tnie tak samo, a przewinąć się nie da; fokus przewija okno, a smoother centruje element sam.
- **Pętla a klawiatura.** Tab do ostatnich linków stopki dojeżdża do końca dokumentu i pętla wyrzucała użytkownika na górę. `forwardWhen` pętli wyklucza fokus w `[data-sources]`; link „Back to the top" najpierw zdejmuje fokus, potem gra.
- **Workery 3.** Przy 4 na jednym Macu (z zamkniętą klapą: `CVDisplayLink` w logach Chromium) klatki bywały tak rzadkie, że test kończył się na timeoucie kliku. Kliki w `layout.spec` i `perf.spec` idą przez `dispatchEvent("click")` (test mierzy układ, nie celność wskaźnika), a `cutTo` czeka, aż smoother dogoni pasek (`settled`).

## Pomiary

- lint 0 · tsc 0 · build 0 · `npm test` 57 passed, 16 skipped (shots), 4.2 min (3 workery; nowy `tests/blob.spec.ts`: SSR kształtów i patternu, kropla → bilet z powrotem patternu, krzywa EASE morfuje z przyciskiem i kulka ląduje na końcu, reduced motion = dokładnie kształty z serwera).
- Perf w izolacji przy 4× CPU: 58.5–60.4 fps w każdym rozdziale, 0 długich klatek w ruchu (najgorsze 21–38 ms), hero start 1 długa klatka 117 ms (P5a: 93; więcej SVG i morfów do przygotowania przed zdjęciem bramki, do zbicia w PR 3 przez odroczenie builderów SVG pod kadrem). FCP 104 ms, LCP 168 ms (`tl`), CLS 0. JS 772 KB raw / 253 KB gzip (+41 KB raw: DrawSVG, MorphSVG, MotionPath), HTML 96 KB (+30 KB ścieżek i patternów SVG).
- Zrzuty: `docs/media/p5b/` (spoczynek 8 rozdziałów × 2 szerokości, klatki w trakcie intro: hero, POSITION, EASE, STAGGER, REVERSE).

## Następne (PR 3)

Zrobione w `P5c-szlif.md`: stopka gra ze słowem, nagrania, FINGERPRINT v7.1, Exit Check, review, wyjątek kadencji hero w MOTION.md.
