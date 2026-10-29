# P5d · v7.1: chaos na scrollu i jego naprawa (29.10.2026, noc)

Werdykt Piotrka po wdrożeniu v7.1: „źle działa wszystko, jest chaos, animacje skaczą, wywołują się po kilka razy". Moje testy przewijały skokami (`window.scrollTo`), nie jak człowiek kółkiem z bezwładnością, więc tego nie widziały.

## Odtworzenie

Symulacja trackpada w Playwrighcie: flick = 24 zdarzenia wheel o malejącej delcie (~970 px), co 1.6 s; log zmian `data-cut-*` i startów `data-phase="intro"`.

Przed naprawą: cięcie startowało przy pierwszym zdarzeniu flicku (`y=180` celu paska, treść jeszcze w hero), kolejne cięcia co 1.2–1.8 s, każdy rozdział grał 1.2 s zanim następne cięcie go zdjęło, po 24 s strona przeszła całość i pętlę i zaczęła drugie okrążenie. Powód: w P5a progi cięć liczyłem od **celu scrolla** (pasek), żeby daleki skok grał najdalsze cięcie. Przy smootherze cel ucieka o sekundę przed obraz, a bezwładność po skoku od razu dociągała następny próg.

## Naprawa

1. **Progi z tego, co widać.** `viewTop(el)` to rect wygładzonej treści (`scroll.ts`). Cięcie startuje, gdy widz naprawdę widzi górę następnego rozdziału na 80 % kadru.
2. **Scroll wstrzymany na czas cięcia.** `holdScroll(true)` = `smoother.paused(true)` od startu cięcia do 0.35 s po jego końcu (`CUT.release`); smoother w pauzie zjada bezwładność trackpada (Observer z preventDefault), więc jeden flick = jedno cięcie, a następne wymaga nowego gestu. Skoki pod zakryciem (`jumpTo`) działają także w pauzie. Zwolnienie wyrównuje pasek z treścią. Stan: `<html data-scroll-hold>`.
3. **Histereza w tył 20 % → 25 %** (`CUT.backAt`): korekta kciukiem po cięciu nie gra go od razu wstecz.

Po naprawie (ta sama symulacja): cięcie przy `y=180` **treści** (nie paska), odstępy 2.7 s, zero łańcucha z bezwładności; dwa flicki w górę cofają raz, dopiero wyraźny gest w dół gra znowu.

## Konsekwencje i testy

- Daleki skok (klawisz End, przeciągnięcie paska) gra najbliższe cięcie i kasuje cel: rozdziały idą zawsze po kolei. To świadomy wybór po chaosie; alternatywa „najdalsze wygrywa" myliła flicki ze skokami.
- Harness: `cutTo` przechodzi rozdziały po kolei od ostatniego zagranego (po drodze bez czekania na spoczynek, jak przy flicku), czeka na zwolnienie scrolla (`unheld`) przed każdym przewinięciem; testy z `cutTo(yours)` dostały 90 s. `cut.spec`: skoki w trakcie cięcia są wstrzymane (bezwładność zjedzona), stan sprawdzany po zwolnieniu. `chain.spec` startuje od spoczynku hero.
- `LayoutProps<"/">` w `layout.tsx` zastąpione jawnym typem: globalny typ z `next typegen` nie istnieje na czystym checkoucie (`npm run typecheck` Piotrka padał).
- `npm test`: 57 passed, 18 skipped, 4.8 min.

## Co dalej, jeśli nadal „skacze"

Potrzebuję jednego konkretu: które miejsce (hero? po cięciu? SCRUB?) i urządzenie (trackpad / mysz z kółkiem / telefon). Mysz z kółkiem skokowym daje delty po 100 px bez bezwładności: tam próg 80 % oznacza cięcie po dwóch kliknięciach kółka, co może wyglądać na „samo się dzieje"; wtedy próg w dół zejdzie do 60 %.
