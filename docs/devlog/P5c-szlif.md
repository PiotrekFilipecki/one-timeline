# P5c · v7.1: szlif, nagrania, Exit Check (29.10.2026)

Model: Fable 5.1. Trzeci PR v7.1 (`v7.1/polish`, na gałęzi PR-a 2). Zamyka v7.1 do oceny Piotrka.

## Co weszło

- **Stopka gra ze słowem** (`src/motion/foot.ts`): podpis odsłania się wycięciem z góry (clip-path, zero układu), linijki kodu wjeżdżają w maskach, przyciski (EASE, COST) rosną z podstawy. Tylko przy pierwszym odegraniu rozdziału; replay i głowica grają samo słowo. POSITION, EASE, STAGGER, REVERSE (hero miał to od P1; COST i YOURS nie mają kontrolera: stoją). Zapisane w MOTION.md.
- **Kadencje hero** zapisane w MOTION.md jako wyjątek od tabeli staggerów (otwarte od P4).
- **Nagrania całej strony** `docs/media/p5/full-page-1440.webm` (20 MB) i `full-page-390.webm` (5 MB): hero → pętla, z przełączeniem COST i Play / Reverse w YOURS. Klatki spoczynku `docs/media/p5/0N-*.png`, klatki wejścia stopki `mid-position-foot`, `mid-ease-foot`.
- **FINGERPRINT.md**: warstwa v7.1 (bohater, dekoracje, scroll, ziarno, układ, ton, czego nie powtarzać).

## Exit Check (taste-guardrail, klatki `docs/media/p5/` i `p5b/`)

Lock ✓ (świat: riso × kinetyczny plakat, teraz z bohaterem) · font nie z banned listy ✓ · jeden akcent + pole z fakturą ✓ · asymetria ✓ (numer raz z lewej, raz z prawej; dyptyki po przekątnej) · sygnaturowy detal ✓ (cięcie przez literę; blob jest bohaterem, nie drugą sygnaturą) · hierarchia ✓ (słowo > blob > numer w konturze) · Tells: żaden ✓ · kontekst ✓ (nic z tego nie pasuje do innej firmy) · warm/analog ✓ (ziarno, rastr) · izolacja ✓ · grupowanie ✓ (podpis przy słowie, bilet kodu osobno) · głębia ✓ (warstwy: numer w konturze za sceną, blob przed polem, ziarno nad wszystkim, bez cienia) · napięcie ✓ (ślimak pełznący poza słowo, YOURS cięte dołem, bilet w locie).

**13/13** (v7: 12/13; głębia przyszła z warstw i faktury, nie z cienia).

## Code review (quick-check, własne zmiany v7.1)

- `[MEDIUM]` `blob.ts`: domyślne parametry rzutowane `BLOB.morph as number`, bo `as const` zawęża typ do literału. Czyściej: `BLOB` bez `as const` albo typ `{ morph: number }`. Follow-up.
- `[MEDIUM]` `EaseCurve.tsx` i `Blob.tsx` dublują `<pattern>`; wspólny `BlobPattern` z `id` jako prop. Follow-up.
- `[MEDIUM]` `cut.ts` liczy progi przez `viewTop`, ale `cutTo` w testach dalej mierzy pozycję z `rect.top + scrollY` przed skokiem: działa, bo czeka na `settled`; warto wystawić `scrollPositionOf` do testów przez `window.__ot` zamiast dublować.
- `[NIT]` `foot.ts` zbiera też `[data-replay]`, którego używa tylko hero (ten nie woła footIntro). Nieszkodliwe, do wycięcia.
- `[NIT]` `shots-p5.spec.ts` to kopia `shots-p4` z podmienioną fazą; parametr `SHOTS_PHASE` mógłby wybierać katalog w jednym pliku.
- Dobre: buildery dalej tylko budują (blob i stopka siedzą w timeline'ie intro, więc głowica scrubuje całość); SSR niesie każdy stan spoczynku (blob, krzywa, linijka), reduced motion = dokładnie HTML z serwera (test `blob.spec`); harness dalej mierzy 0 przesunięć mimo parallaxu i SVG.

## Pomiary

- lint 0 · tsc 0 · build 0 · `npm test` 57 passed, 18 skipped (shots), 4.2 min.
- Perf w izolacji przy 4× CPU: 58.5–60.4 fps w każdym rozdziale, 0 długich klatek w ruchu (najgorsze 20–43 ms), hero start 1 długa klatka 108 ms. FCP 104 ms, LCP 164 ms (`tl`), CLS 0. JS 772 KB raw / 253 KB gzip, HTML 96 KB. Bez zmian względem P5b: stopka to clip-path i transformy.

## Co zostaje po v7.1 (do decyzji Piotrka)

1. Merge PR 1 → 2 → 3 (klasyfikator auto-mode blokuje `gh pr merge`); po merge PR 1 Vercel wdroży produkcję, PR 2 i 3 przestawią bazę same.
2. Telefon w ręce: smooth scroll (na dotyku natywny, parallax i numery dalej jadą), blob w każdym rozdziale, SCRUB z kołem pod kciukiem, pętla, Tab przez stopkę (nie wyrzuca na górę).
3. Hero start: jedna długa klatka ~120 ms przy 4× CPU (hydracja + split zdania + SVG przed zdjęciem bramki). Do zbicia przez odroczenie builderów SVG rozdziałów pod kadrem o klatkę więcej; nie blokuje.
4. Własna domena (`SITE_URL`), Search Console, link zwrotny z portfolio.
