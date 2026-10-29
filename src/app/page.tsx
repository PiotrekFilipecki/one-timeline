import { Hero } from "@/chapters/Hero";
import { Position } from "@/chapters/Position";
import { Ease } from "@/chapters/Ease";
import { Stagger } from "@/chapters/Stagger";
import { Scrub } from "@/chapters/Scrub";
import { Reverse } from "@/chapters/Reverse";
import { Cost } from "@/chapters/Cost";
import { Sources, Yours } from "@/chapters/Yours";
import { Cuts } from "@/components/Cuts";

// Jedna strona, osiem plakatów w łańcuchu kolorów (MOTION.md). Kolejność = PLAN §4.
export default function Page() {
  return (
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
      {/* Cięcia przez literę między rozdziałami: jedno koło, konfiguracja w src/motion/cuts.ts. */}
      <Cuts />
    </main>
  );
}
