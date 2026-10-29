import type { Metadata } from "next";
import { Anybody } from "next/font/google";
import { BOOT_SCRIPT } from "@/motion/boot";
import { MotionBoot } from "@/components/MotionBoot";
import { Favicon } from "@/components/Favicon";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, author, jsonLd } from "@/lib/site";
import "./globals.scss";

// Jedna rodzina, jest aktorem: osie wdth 50–150 i wght 100–900 (variable). next/font self-hostuje plik,
// preloaduje go i dopasowuje metryki fallbacku (size-adjust), więc fallback trzyma te same łamania.
const anybody = Anybody({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-anybody",
  display: "swap",
});

const who = author();

// SEO (v7.1): tytuł, opis i autor w metadanych, Open Graph / Twitter z obrazem (app/opengraph-image.png),
// canonical, robots; JSON-LD z Person (portfolio i profile z COPY.md), robots.ts i sitemap.ts obok.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["GSAP", "GSAP timeline", "ScrollTrigger", "web animation", "motion design", "Next.js", "variable font", "kinetic typography", who.name],
  authors: [{ name: who.name, url: who.url }],
  creator: who.name,
  publisher: who.name,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  openGraph: { type: "website", url: "/", siteName: SITE_NAME, title: SITE_TITLE, description: SITE_DESCRIPTION, locale: "en_US" },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: skrypt bramki dopisuje data-motion-boot zanim React zhydratuje <html>.
    <html lang="en" className={anybody.variable} suppressHydrationWarning>
      <head>
        {/* Bramka pierwszej klatki. Marker nigdy nie jest w HTML z serwera: bez JS nie ma bramki. */}
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }} />
      </head>
      <body>
        <MotionBoot />
        <Favicon />
        {children}
      </body>
    </html>
  );
}
