// COST: prawdziwy koszt klatki. Litery słowa COST orbitują. Tryb transform: zapis x/y na warstwie kompozytora
// (will-change: transform), główny wątek nie maluje. Tryb layout: te same litery na left/top, dosuwane po
// pikselu z odczytem offsetLeft/offsetTop po każdym zapisie (klasyczny layout thrashing: zapis, odczyt,
// zapis, odczyt) i bez warstwy, więc każda klatka maluje glify od nowa. Pomiary w devlogu P3.
// Jedna liczba ms na klatkę = średnia wykładnicza odstępów między klatkami (rAF), tekst odświeżany ≤ 8×/s.
// Gdy średnia > 17.5 ms przez 10 kolejnych klatek: pole tnie się na czerwień (set, nie tween); powrót
// na transform: cięcie z powrotem na miętę. Orbita tylko w kadrze; pauza dostępna; bezpiecznik czasu na
// klatkę, żeby strona nigdy się nie zawiesiła.
"use client";

import { gsap, registerMotion } from "./register";
import { prefersReducedMotion } from "./reduced-motion";
import { fontsReady } from "./boot";
import { splitLetters, type Split } from "./split";
import { JANK, chapter } from "@/lib/palette";

export const COST = {
  budget: 17.5,
  window: 10,
  /** Promień orbity w em, obrót na sekundę. */
  radius: 0.14,
  rps: 0.45,
  /** Maks. ms pracy w jednej klatce w trybie layout; powyżej reszta odczytów jest pomijana. */
  fuse: 40,
  /** Odświeżanie liczby. */
  readoutHz: 8,
} as const;

export type CostMode = "transform" | "layout";

export type CostScene = {
  readonly mode: CostMode;
  readonly paused: boolean;
  setMode: (mode: CostMode) => void;
  setPaused: (paused: boolean) => void;
  destroy: () => void;
};

export function createCost(root: HTMLElement): CostScene {
  registerMotion();
  const word = root.querySelector<HTMLElement>('[data-word="cost"]')!;
  const readout = root.querySelector<HTMLElement>("[data-ms]");
  const mint = chapter("cost").bg;
  let split: Split | null = null;
  let mode: CostMode = "transform";
  let paused = false;
  let inView = false;
  let destroyed = false;
  let ticking = false;
  let last = 0;
  let ema = 0;
  let over = 0;
  let jank = false;
  let lastReadout = 0;
  let angle = 0;
  let em = 16;
  /** Bieżące pozycje w trybie layout (całe piksele, dosuwane krokami). */
  const cur: { x: number; y: number }[] = [];

  const setJank = (on: boolean) => {
    if (jank === on) return;
    jank = on;
    if (on) {
      root.dataset.jank = "";
      root.style.setProperty("--bg", JANK.bg);
    } else {
      delete root.dataset.jank;
      root.style.setProperty("--bg", mint);
    }
  };

  const show = (ms: number, now: number) => {
    if (!readout || now - lastReadout < 1000 / COST.readoutHz) return;
    lastReadout = now;
    readout.textContent = ms.toFixed(1);
    root.dataset.ms = ms.toFixed(1);
  };

  const measure = (now: number) => {
    const dt = last ? now - last : 16.7;
    last = now;
    ema = ema ? ema * 0.8 + dt * 0.2 : dt;
    if (ema > COST.budget) over++;
    else over = 0;
    // Czerwień tylko w trybie left/top: transform jest grupą kontrolną, a liczba ms zostaje prawdziwa w obu.
    // (v7.1: smoother + ziarno podniosły koszt klatki tak, że 4 równoległe przeglądarki w testach
    // przekraczały budżet w trybie transform; czerwień ma mówić o left/top, nie o obciążeniu maszyny.)
    if (over >= COST.window && mode !== "transform") setJank(true);
    else if (ema <= COST.budget && mode === "transform") setJank(false);
    show(ema, now);
  };

  const orbit = () => {
    if (!split) return;
    const chars = split.chars;
    angle += (COST.rps * 2 * Math.PI * gsap.ticker.deltaRatio(60)) / 60;
    const r = COST.radius * em;
    const t0 = performance.now();
    chars.forEach((c, i) => {
      const a = angle + (i * Math.PI) / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (mode === "transform") {
        gsap.set(c, { x, y });
      } else {
        // left/top po pikselu: zapis, odczyt layoutu, zapis, odczyt. Każdy odczyt po zapisie wymusza layout.
        // Bezpiecznik: po COST.fuse ms pracy w tej klatce reszta kroków czeka na następną.
        const p = (cur[i] ??= { x: 0, y: 0 });
        const tx = Math.round(x);
        const ty = Math.round(y);
        let guard = 0;
        while ((p.x !== tx || p.y !== ty) && guard++ < 24 && performance.now() - t0 < COST.fuse) {
          if (p.x !== tx) {
            p.x += Math.sign(tx - p.x);
            c.style.left = `${p.x}px`;
            void c.offsetLeft;
          }
          if (p.y !== ty) {
            p.y += Math.sign(ty - p.y);
            c.style.top = `${p.y}px`;
            void c.offsetTop;
          }
        }
      }
    });
  };

  const tick = () => {
    const now = performance.now();
    measure(now);
    if (!paused) orbit();
  };

  const start = () => {
    if (ticking || destroyed) return;
    ticking = true;
    last = 0;
    gsap.ticker.add(tick);
  };
  const stop = () => {
    if (!ticking) return;
    ticking = false;
    gsap.ticker.remove(tick);
  };
  const sync = () => {
    if (inView && !prefersReducedMotion()) start();
    else stop();
  };

  const io = new IntersectionObserver(
    (entries) => {
      inView = entries.some((e) => e.isIntersecting);
      root.dataset.costInView = String(inView);
      sync();
    },
    { threshold: 0.2 },
  );

  const build = async () => {
    await fontsReady(1500);
    if (destroyed) return;
    em = parseFloat(getComputedStyle(word).fontSize);
    if (prefersReducedMotion()) {
      // Pomiar spoczynkowy: 12 klatek bez ruchu, potem stop.
      let n = 0;
      const once = () => {
        measure(performance.now());
        if (++n >= 12) {
          gsap.ticker.remove(once);
          lastReadout = 0;
          show(ema, performance.now() + 1000);
        }
      };
      gsap.ticker.add(once);
      root.dataset.costReady = "";
      return;
    }
    split = splitLetters(word);
    for (const c of split.chars) {
      c.style.position = "relative";
      c.style.willChange = "transform";
    }
    io.observe(root);
    root.dataset.costReady = "";
  };
  void build();

  return {
    get mode() {
      return mode;
    },
    get paused() {
      return paused;
    },
    setMode: (m) => {
      if (m === mode || !split) return;
      mode = m;
      root.dataset.mode = m;
      // Zmiana właściciela pozycji: wyczyść poprzedni mechanizm, żeby litery nie dostały podwójnego przesunięcia.
      if (m === "transform") {
        for (const c of split.chars) {
          c.style.left = "";
          c.style.top = "";
          c.style.willChange = "transform";
        }
        over = 0;
        setJank(false);
      } else {
        gsap.set(split.chars, { x: 0, y: 0, clearProps: "transform" });
        for (const c of split.chars) c.style.willChange = "auto";
        cur.length = 0;
      }
    },
    setPaused: (p) => {
      paused = p;
      root.dataset.costPaused = String(p);
    },
    destroy: () => {
      destroyed = true;
      stop();
      io.disconnect();
      split?.revert();
      split = null;
      setJank(false);
      root.style.removeProperty("--bg");
      delete root.dataset.mode;
      delete root.dataset.costReady;
    },
  };
}
