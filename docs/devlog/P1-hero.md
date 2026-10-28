# P1 · Hero, opener, POSITION, cięcie przez literę, głowica (29.10.2026)

Model: Fable 5.1, effort high. Czas sesji: ok. 2 h 40 min (build ≈ 1 h 10, debug i testy ≈ 1 h 10, media i devlog ≈ 20 min).
Bramka kierunku: po tej fazie Piotrek ocenia na telefonie „występ czy animacja?".

## Skille: co wybrałem i dlaczego

| Skill | Użyty do | Co wziąłem |
|---|---|---|
| `animaxxing` (`split-entrances`, `hover-effects` → `fontAxisHover`, `text-stability`, `verification`) | hero.ts, hover.ts, split.ts | Box słowa trzyma szerokość podczas splitu; hover szerokości w pinned boxie z `inline-block` w CSS spoczynku; touch nigdy nie zostawia hovera; revert przy spoczynku; „nie tween letter-spacing/width na tekście, który się łamie". |
| `gsap-nextjs` (`initialization`, `motion-system`) | chapter.ts (prepare → handOff), boot.ts | Właściciele bramki: stan startowy na DOM przed zdjęciem bramki; deadline uzbrojony przed splitem; powtórny setup na tym samym DOM; „back/forward never run an outro" przełożone na „przewinięcie w górę gra cięcie wstecz, nie outro rozdziału". |
| `design-motion:gsap-timeline` / `gsap-core` | hero.ts, position.ts, jump.ts | `addLabel` dla znaczników, pozycje `"+=0"` / `"<0.06"` policzone jawnie (czas lądowania skoku jako jednostka), `easeReverse: true` na timeline'ie cięcia. |
| `gsap-scrolltrigger` | chapter.ts, cut.ts | Dwa progi cięcia (w dół 80 %, w górę 20 %) jako osobne triggery; po skoku dokumentu oba są po właściwej stronie. |
| `gsap-plugins` (SplitText) | split.ts | `SplitText.create(..., { type: "chars", aria: "auto" })`; revert przywraca tekst. |
| `gsap-react` | HeroMotion, PositionMotion | Komponent kliencki montowany wewnątrz Field; DOM spoczynku z serwera, klient go tylko odgrywa. Zamiast `useGSAP` użyłem `useEffect` + kontroler z własnym `destroy()`: kontroler trzyma timeline'y, triggery i listenery poza kontekstem GSAP (głowica, cięcie), więc jeden `destroy` jest prostszy niż dwa mechanizmy sprzątania. |
| `motion-design` | jump.ts | Antycypacja (scaleY 0.8 / scaleX 1.12), stretch w locie, squash przy lądowaniu, osiadanie `back.out(2.2)`, lżejsza waga w powietrzu (500 → 800 przy lądowaniu). |
| `taste-guardrail` (Exit Check) | ocena klatek, niżej | |
| `a11y-gate` | głowica, opener, słowa | `role="slider"` z `aria-valuetext` z czasem, 24 px pola chwytu; opener ≤ 3 zmiany/s mierzone; słowa zdania jako `<button>` z nazwą (bez JS `tabindex=-1`, bo nic nie robią). |

## Co powstało (zakres H1–H7)

- **H1 Opener.** 8 cięć w 0.8 s to 10 zmian/s, więc osiem pasków naraz (`OpenerBars`, SSR, widoczne tylko pod bramką przy `data-opener="play"`), hold 0.22 s, wyjście w górę na `beat-exit` z odstępem 0.045 s. Jeden punkt ekranu zmienia kolor dokładnie raz (test: 1 zmiana/s w każdym z trzech punktów). Tylko pierwsze wejście w sesji (`sessionStorage`), przy reduced motion pominięty.
- **H2 Hero.** Każde słowo odgrywa swój rozdział: sequence = skoki z wagą po kolei (0.12 s kadencji), overlap = fala zza maski, ease = opad zza górnej krawędzi i osiadanie na `beat`, stagger = od środka z podstawy (scaleY), scrub = wejście skondensowane (wdth 50 → 100, szerokości przypięte), reverse = od końca, z prawej. Znaczniki czasu rosną z podstawy po lądowaniu słowa; tekst znacznika to `formatTime(tl.labels[słowo])`. Replay gra tylko zdanie (linijka i przycisk stoją). Hover/focus słowa: `fontStretch` 100 → 112 % w boxie trzymanym dokładnie; klik = replay.
- **H3 POSITION.** Góra `"+=0"`: każdy skok po lądowaniu poprzedniego (0.24 s), SEQUENCE w 2.1 s. Dół `"<0.06"`: skok co 0.06 s, OVERLAP w 0.84 s. Linijki kodu w maskach z dołu po górnym rzędzie; outro (cięcie wstecz) wyprowadza je w górę.
- **H4 Głowica.** Hairline 2 px w `--fg`, 24 px pola chwytu, w spoczynku przy prawej krawędzi sceny (= koniec timeline'u; widoczna, więc jest afordancja). Intro jedzie `x` od lewej. Pointer (także dotyk, `touch-action: none`, pointer capture) i klawiatura (strzałki ±2 %, PageUp/Down ±10 %, Home/End); `aria-valuetext` = „0:01.20 of 0:02.10". Po puszczeniu (pointerup, blur) rozdział wraca do spoczynku.
- **H5 Cięcie.** Osobne koło (`[data-cut]`, fixed, `border-radius: 50 %`) w kolorze śliwki startuje z bounding boxa kropki i rośnie na `expo.in` 0.6 s do promienia najdalszego rogu. W chwili zakrycia dokument skacze na górę POSITION (`scrollTo` instant, kadr jednolity, skoku nie widać), koło znika, POSITION gra na beat. Wstecz: koło pełne, skok na dół hero, kurczenie na `expo.out` (timeline ma `easeReverse: true`). Maks. 3 kolory w trakcie (dwa pola + koło).
- **H6 Reduced motion.** Bez bramki, openera i splitu; cięcie = natychmiastowa zmiana pola (scrollowanie bez skoku); głowica działa jako suwak (seek ustawia stan bez animacji).
- **H7 Testy.** `layout.spec` nagrywa boxy przez 6.5 s intro + hover i focus 6 słów + focus Replay na 7 szerokościach; `cut.spec` (próg → śliwka, powrót → róż, 5 szybkich przejść = 1 odegranie, stan zgodny z pozycją); `playhead.spec` (klawiatura, valuetext, blur → spoczynek, revert splitu); `opener.spec` (kolor pod 3 punktami co klatkę, ≤ 3 zmiany/s); `reduced.spec` i `nojs.spec` rozszerzone. Razem 26 testów + 6 shots.

## Decyzje i lekcje

1. **Dwa progi cięcia zamiast jednego.** Po skoku dokumentu na górę POSITION próg 80 % jest daleko za plecami; gdyby był jedyny, powrót wymagałby przewinięcia 80 % kadru. Próg wstecz 20 % działa po 20 % przewinięcia.
2. **Intencja ważniejsza od kolejki.** W chwili zakrycia kadru cięcie sprawdza realną pozycję dokumentu: jeśli użytkownik wrócił nad próg, koło kurczy się bez skoku; jeśli przewinął już za POSITION, nie ściągamy go z powrotem (`onPassed` → POSITION staje w spoczynku). Test 5 szybkich przejść: 1 odegranie.
3. **Transformy nie działają na elementach inline.** `sup`, `code` i `button` po `all: unset` są inline: `scaleY(0)` był w computed style, a tekst dalej widoczny (nagranie to pokazało). Każdy element, który GSAP rusza, musi być `inline-block` albo `block` w CSS spoczynku.
4. **Harness odejmuje własną translację elementu.** `getBoundingClientRect` liczy transformy, a transform nie jest przesunięciem układu; linijka wjeżdżająca `yPercent` wyglądała na 46 przesunięć. EPS 0.01 px (poniżej 1/64 px jednostki Chromium) zjada tylko szum serializacji macierzy.
5. **Box słowa trzyma szerokość przez split.** Suma inline-blocków liter różni się od ciągłego tekstu o 2–5 × 1/64 px (0.03–0.08 px); harness to widział przy revert. `splitLetters` zapisuje dokładny float szerokości na `.t` przed splitem i zdejmuje przy revert → 0 przesunięć.
6. **Maska przez `clip-path`, nie `overflow`.** `overflow: hidden` na inline-blocku przenosi baseline na dolną krawędź i przesuwa wiersz. `clip-path: inset(-0.2em -0.08em -0.3em)` zostawia układ w spokoju i ma zapas na akcenty i wydłużenia.
7. **Zero fade-up.** Pierwsza wersja miała `autoAlpha` w każdym wejściu. Teraz: litery pojawiają się natychmiast w chwili startu swojego ruchu (sequence, scrub, reverse) albo wchodzą zza maski (overlap, ease); stagger i znaczniki rosną z podstawy (scaleY). Jedyna alfa to `set` 0 → 1 (skok, nie przenikanie).
8. **`data-opener` na `<html>` vs paski.** Reguła `[data-opener]{display:none}` dla pasków trafiła w `<html data-opener="skip">` i strona znikała z JS (biały kadr, 0×0). Paski to teraz `[data-opener-bars]`. Lekcja: atrybuty stanu na `<html>` muszą mieć inne nazwy niż selektory elementów.
9. **POSITION bez autoplay.** Gra, gdy woła je cięcie; po reloadzie w środku strony (już w kadrze) staje w spoczynku zamiast tkwić w stanie startowym.
10. **Skok zdania hero: `back.out(2.2)` w osiadaniu** to część sygnaturowego ruchu z MOTION.md, nie dodatkowa krzywa. Żadna krzywa nie została dostrojona; `beat` i `beat-exit` bez zmian (MOTION.md nietknięty w P1).

## Pomiary

- `npm run lint` 0 · `npx tsc --noEmit` 0 · `npm run build` 0 · `npm test`: 26 passed, 6 skipped (shots), 39 s · `npm run shots p1`: 6 passed, 28 plików.
- **Układ:** 7 szerokości × ~385 klatek × 37 boxów przez całe intro: 0 przesunięć; hover/focus × 6 słów + Replay: 0; brak poziomego scrolla.
- **Opener:** 3 punkty (paski 1, 4, 7): po 1 zmianie koloru, maks. 1/s; ląduje na różu; drugie wejście w sesji bez openera.
- **Cięcie:** próg → `data-cut-state: cutting` → `after` w < 3 s, pole pod kursorem = `#4A0D3A`, `scrollY` = górna krawędź POSITION; powrót → `before`, róż; 2 odegrania na parę. 5 szybkich przejść: 1 odegranie, stan `before`, róż.
- **Głowica:** Home → `aria-valuenow 0`, 10 × ArrowRight → 20, `aria-valuetext` „0:00.42 of 0:02.10", End/ArrowLeft → 98, blur → spoczynek, 0 elementów `.ch`.
- **Hero timeline:** opener 0.8 s + zdanie 4.6 s + linijka/Replay ≈ 5.9 s do spoczynku (nagranie: faza `rest` w 5.85 s od pierwszej klatki).

## Klatki i nagrania (docs/media/p1, obejrzane)

- `hero-mid-intro-*`: „Sequ|en" w locie, reszta zdania pusta, znaczniki niewidoczne do lądowania słów (po poprawce 3). Antycypacja i stretch widoczne na „e" i „n".
- `hero-rest-*`: zdanie jako czysta typografia, znaczniki przy słowach, linijka i Replay w stopce. 390: 6 wierszy, Replay pod linijką.
- `cut-50-*`: koło śliwki na kropce (expo.in: w 50 % czasu ma ~1/6 promienia; właściwy wzrost to ostatnie 0.15 s). Trzy kolory: róż, śliwka, acid etykiety POSITION.
- `position-jumping-*`: „Q" w locie z lżejszą wagą, hairline w miejscu Q. `position-rest-*`: dyptyk stoi, hairline przy prawej krawędzi.
- `hero-to-position-*.webm` (12.6 s): opener → zdanie → scroll → kropka rośnie → POSITION. Uwaga: skrypt kółka kontynuuje przewijanie po skoku dokumentu, więc POSITION gra lekko przesunięte; w realnym trackpadzie momentum zrobi to samo. Do oceny na telefonie.

**Exit Check (taste-guardrail, 11/13):** Lock ✓ · font nie z banned listy ✓ · 1 akcent + pole (płaski druk, celowo) ✓ · asymetria ✓ · sygnaturowy detal (cięcie przez literę) ✓ · hierarchia ✓ · Tells: żaden ✓ · kontekst ✓ · warm/analog: riso-flat ✓ · izolacja ✓ · grupowanie ✓ · głębia: n/d dla płaskiego druku ✗ · napięcie ✓. Test kostiumu: żaden rekwizyt spoza PLAN §4 (koło cięcia i hairline są w planie).

**Występ czy pospolita animacja?** Antycypacja: tak (każdy skok bierze zamach). Squash: tak (lądowanie 0.82/1.16, osiadanie back.out). Cisza przed szczytem: częściowo. Hold openera 0.22 s i pauza między lądowaniem „reverse." a kropką, ale między słowami nie ma oddechu: starty 0.9 / 0.7 / 0.7 / 0.8 / 0.8 s nachodzą na osiadanie poprzedniego. Fade-up / crossfade: nie (po poprawce 7). Werdykt modelu: występ, z zastrzeżeniem, że „ease" i „overlap" grają podobnie (oba to pion zza maski) i oglądane z ręki mogą się zlać; P1.1, jeśli Piotrek to potwierdzi: „ease" bez maski, spadające z wysokości z wyraźnym przestrzeleniem na całym słowie.

## Do oceny przez Piotrka (telefon, 3 rzeczy)

1. **Cięcie.** Czy kropka rosnąca 0.6 s na expo.in czyta się jako „litera zalewa kadr", czy jako „kropka, potem nagle śliwka"? Jeśli drugie: 0.7 s albo `power4.in`.
2. **Skok z wagą.** Czy litery POSITION mają masę (zamach → strzał → squash)? Jeśli za lekkie: wyższy skok (0.45em → 0.6em) i dłuższy squash.
3. **Głowica.** Czy palec łapie hairline bez celowania (24 px) i czy przeciąganie przez „SEQUENCE" daje poczucie, że słowo gra pod palcem? Jeśli nie: szerszy chwyt i podświetlenie podczas przeciągania.

## Poza zakresem, do rozważenia

- Opener jako paski to decyzja z promptu; alternatywa (8 błysków po 0.1 s) łamie WCAG 2.3.1 i została odrzucona.
- `Replay` i słowa-przyciski bez JS: `tabindex=-1` i brak akcji; można je renderować jako `span` i podmieniać w kliencie (hydration mismatch), nie warto.
- Pauza między słowami hero (ok. 0.15 s) poprawiłaby „ciszę przed szczytem" kosztem 0.75 s całości.

## Pięć linijek

1. **Jak zobaczyć na telefonie:** `npm run dev -- -H 0.0.0.0`, `ipconfig getifaddr en0`, `http://<IP>:3000`. Opener gra raz na sesję: nowa karta = nowy opener. Nagrania: `docs/media/p1/*.webm`.
2. **Co pominąłem:** nic z zakresu. Pauzy między słowami hero (poza zakresem) nie dodałem.
3. **Werdykt do wpisania:** linijka „gra czy animacja?" pod nagłówkiem „Do oceny" po obejrzeniu na telefonie.
4. **Co zmieniłem w wiążących plikach:** nic. MOTION.md bez zmian w P1.
5. **Następna faza:** P2 (EASE, STAGGER, SCRUB, REVERSE) na tym samym kontrolerze, głowicy i cięciu.
