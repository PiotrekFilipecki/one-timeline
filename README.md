# One Timeline

Jedna strona o GSAP timeline, która sama jest dowodem: osiem pełnoekranowych plakatów w dwukolorowym druku, a każde pojęcie (sequence, overlap, ease, stagger, scrub, reverse, cost, yours) odgrywa słowo, które je nazywa. Jeden variable font (Anybody) jest aktorem; kolor zmienia się wyłącznie cięciem przez literę. Treść strony po angielsku, dokumentacja po polsku.

## Uruchomienie

```bash
npm install
npm run dev                  # http://localhost:3000
npm run dev -- -H 0.0.0.0    # z telefonu: http://<IP Maca>:3000 (ipconfig getifaddr en0)
```

Wersje przypięte w `package.json`: Next 16.4.3, gsap 3.15.0, @gsap/react 2.1.2, sass 1.106.1, @playwright/test 1.64.1. Nie podbijać bez wpisu w devlogu.

## Testy i bramki

```bash
npm run lint && npx tsc --noEmit && npm run build
npm test                     # Playwright przeciw buildowi produkcyjnemu (port 3124); buduje i startuje sam
npm run shots p4             # screenshoty i nagrania do docs/media/p4/
```

Co sprawdza `npm test` (`tests/`): kontrasty palety liczone wzorem WCAG; 0 przesunięć układu na 7 szerokościach przez intro hero, hover i focus, każdy rozdział i przewijanie SCRUB (`harness.ts`); łańcuch kolorów przez wszystkie cięcia; pozycje kopii EASE vs `gsap.parseEase`; fps przy 4× CPU; COST w trybie left/top przy 12× CPU; YOURS (walidacja, Play, Reverse, Copy); pętla; strona bez JS i z reduced motion; ścieżka klawiaturą i widoczny focus; LCP, CLS i rozmiar JS.

## Gdzie co jest

- `MOTION.md`: wiążący brief ruchu (osobowość, krzywe `beat` / `beat-exit`, czasy, paleta, reguły). Czytać przed każdą zmianą animacji.
- `docs/PLAN.md`: rozdziały, Lock, fazy. `docs/PROMPTY.md`: prompty faz P0–P4. `docs/COPY.md`: jedyne źródło treści.
- `docs/adr/0001-architektura.md`: dlaczego jedna strona, kontroler per rozdział, SCRUB jako jedyny scrub, natywny scroll.
- `docs/devlog/P0…P4`: decyzje, pomiary, lekcje każdej fazy. `docs/STATUS.md`: stan i bramki. `docs/FINGERPRINT.md`: odcisk palca v7.
- `src/lib/palette.ts`: paleta (jedno źródło koloru, zmienne CSS na `[data-chapter]`). `src/motion/`: rdzeń ruchu (`register`, `boot`, `chapter`, `split`, `cut`, `cuts`, `playhead`, buildery rozdziałów). `src/chapters/`: osiem rozdziałów jako Server Components. `src/components/*Motion.tsx`: klienci, którzy odgrywają stan spoczynku z serwera.
- `CLAUDE.md`: zasady repo dla kolejnych sesji.

## Zasady w skrócie

SCSS Modules, zero Tailwinda. GSAP tylko przez `src/motion/`. SSR renderuje spoczynek, JS go odgrywa; bez JS strona jest czytelna jako osiem plakatów. Każda faza kończy się testami, screenshotami obejrzanymi przez model i devlogiem.
