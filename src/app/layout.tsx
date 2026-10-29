import type { Metadata } from "next";
import { Anybody } from "next/font/google";
import { BOOT_SCRIPT } from "@/motion/boot";
import { MotionBoot } from "@/components/MotionBoot";
import { Favicon } from "@/components/Favicon";
import "./globals.scss";

// Jedna rodzina, jest aktorem: osie wdth 50–150 i wght 100–900 (variable). next/font self-hostuje plik,
// preloaduje go i dopasowuje metryki fallbacku (size-adjust), więc fallback trzyma te same łamania.
const anybody = Anybody({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-anybody",
  display: "swap",
});

export const metadata: Metadata = {
  title: "One Timeline",
  description: "Sequence, overlap, ease, stagger, scrub, reverse. One GSAP timeline, performed by the words that name its moves.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: skrypt bramki dopisuje data-motion-boot zanim React zhydratuje <html>.
    <html lang="en" className={anybody.variable} suppressHydrationWarning>
      <head>
        {/* Bramka pierwszej klatki. Marker nigdy nie jest w HTML z serwera: bez JS nie ma bramki. */}
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body>
        <MotionBoot />
        <Favicon />
        {children}
      </body>
    </html>
  );
}
