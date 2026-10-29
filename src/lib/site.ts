import { copy } from "./copy";

// Dane strony i autora do metadanych, JSON-LD, robots i sitemap. Adres: Vercel do czasu własnej domeny
// (zmiana w jednym miejscu). Autor i jego profile z docs/COPY.md (## author), więc stopka i schema mówią to samo.

export const SITE_URL = "https://one-timeline.vercel.app";
export const SITE_NAME = "One Timeline";
export const SITE_TITLE = "One Timeline · GSAP timeline, performed by the words that name its moves";
export const SITE_DESCRIPTION =
  "Sequence, overlap, ease, stagger, scrub, reverse, cost, yours. One GSAP timeline explained by a kinetic two-colour poster, built by Piotrek Filipecki with Next.js, GSAP 3.15 and one variable font.";

export type Author = { name: string; url: string; sameAs: string[] };

/** Nazwisko z tytułu sekcji „Made by …", portfolio z pierwszego linku, reszta jako sameAs (schema.org Person). */
export function author(): Author {
  const c = copy("author");
  const links = c.link ?? [];
  const portfolio = links.find((l) => /portfolio/i.test(l.label)) ?? links[0];
  return {
    name: c.title.replace(/^made by\s+/i, "").trim(),
    url: portfolio?.url ?? SITE_URL,
    sameAs: links.map((l) => l.url).filter((u) => u !== portfolio?.url),
  };
}

/** JSON-LD: strona, autor jako Person z profilami, temat (GSAP). Jeden graf, trzy węzły. */
export function jsonLd(): Record<string, unknown> {
  const a = author();
  const person = { "@type": "Person", "@id": `${a.url}#person`, name: a.name, url: a.url, sameAs: a.sameAs };
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: SITE_NAME, description: SITE_DESCRIPTION, inLanguage: "en", author: { "@id": person["@id"] } },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#page`,
        url: SITE_URL,
        name: SITE_TITLE,
        description: SITE_DESCRIPTION,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        author: { "@id": person["@id"] },
        creator: { "@id": person["@id"] },
        inLanguage: "en",
        about: [
          { "@type": "SoftwareApplication", name: "GSAP", url: "https://gsap.com/" },
          { "@type": "Thing", name: "Web animation" },
        ],
        keywords: "GSAP, timeline, ScrollTrigger, web animation, motion design, Next.js, variable font, creative development",
      },
      person,
    ],
  };
}
