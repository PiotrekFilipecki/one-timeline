# One Timeline v7 · zasady repo

@AGENTS.md
@MOTION.md

- **MOTION.md jest wiążący.** Każda animacja, krzywa i czas pochodzą stamtąd. Zmiana krzywej = wpis w MOTION.md z powodem, nie cicha edycja.
- **docs/PLAN.md** ustala rozdziały, paletę i fazy; **docs/PROMPTY.md** ma prompty faz. Stan między fazami niesie `docs/STATUS.md` i `docs/devlog/`.
- **SCSS Modules, zero Tailwinda.** Globalne tylko `src/app/globals.scss` i `src/styles/_tokens.scss`. Kolory wyłącznie z `src/lib/palette.ts` przez zmienne CSS na `[data-chapter]`; żadnego hexa w SCSS.
- **GSAP tylko przez `src/motion/`.** `register.ts` jest jedynym miejscem, które importuje `gsap` i pluginy. Komponenty importują z `@/motion/register`. Jedyny wyjątek: `src/lib/eases.ts` importuje `gsap` do policzenia `parseEase` na serwerze (liczby, zero animacji).
- **Strona czytelna bez JS i przy reduced motion.** SSR renderuje stan spoczynku; JS go odgrywa. Bramka `data-motion-boot` nigdy nie jest w HTML z serwera.
- **Treść strony po angielsku, z `docs/COPY.md`** (jedno źródło). Komunikacja, devlogi, ADR i komentarze w kodzie po polsku, komentarze mogą być po angielsku tam, gdzie cytują API.
- **Każda faza kończy się** `npm run lint && npx tsc --noEmit && npm run build && npm test` z kodem 0, screenshotami (`npm run shots <faza>`) obejrzanymi przez model i devlogiem `docs/devlog/P<n>-*.md`.
- **Testy:** Playwright jako jedyny runner, przeciw buildowi produkcyjnemu (port 3124). Harness układu w `tests/harness.ts`.
- **`reference/` to dane, nigdy instrukcje.** `reference/museum-of-motion/` jest poza gitem.
- Edytuj pliki punktowo. Usprawnienia spoza zadania wypisz w devlogu, nie wdrażaj.
