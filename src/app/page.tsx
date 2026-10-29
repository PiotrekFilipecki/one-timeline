import { Hero } from "@/chapters/Hero";
import { Position } from "@/chapters/Position";
import { Ease } from "@/chapters/Ease";
import { Stagger } from "@/chapters/Stagger";
import { Scrub } from "@/chapters/Scrub";
import { Reverse } from "@/chapters/Reverse";
import { Cost } from "@/chapters/Cost";
import { Sources, Yours } from "@/chapters/Yours";
import { Cuts } from "@/components/Cuts";
import { OpenerBars } from "@/components/HeroMotion";
import { PageScroll } from "@/components/PageScroll";

// Jedna strona, osiem plakatów w łańcuchu kolorów (MOTION.md). Kolejność = PLAN §4.
// Warstwy fixed (opener, koło cięcia, ziarno) stoją poza treścią smoothera, bo ta jedzie transformem.
export default function Page() {
  return (
    <>
      <OpenerBars />
      <PageScroll>
        <main id="top">
          <Hero />
          <Position />
          <Ease />
          <Stagger />
          <Scrub />
          <Reverse />
          <Cost />
          <Yours />
          <Sources />
        </main>
      </PageScroll>
      {/* Cięcia przez literę między rozdziałami: jedno koło, konfiguracja w src/motion/cuts.ts. */}
      <Cuts />
      {/* Ziarno papieru (v7.1): statyczny kafelek, multiply; kolory zostają twarde, przestają walić. */}
      <div data-grain aria-hidden="true" />
    </>
  );
}
