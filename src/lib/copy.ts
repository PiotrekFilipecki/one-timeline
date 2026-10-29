
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ChapterId } from "./palette";

// docs/COPY.md jest jedynym źródłem treści strony. Parser zna tylko te klucze.
export type ChapterCopy = {
  /** Nazwa rozdziału w etykiecie indeksu i aria-label sekcji. */
  title: string;
  word: string;
  word2?: string;
  line: string;
  code: string[];
  /** Hero: znaczniki czasu słów, jeden na słowo zdania. */
  marks?: string[];
  number?: string;
  unit?: string;
  /** Etykiety UI rozdziału (przycisk Replay, slider głowicy, przełączniki COST, przyciski YOURS). */
  replay?: string;
  playhead?: string;
  toggle?: string;
  pause?: string;
  play?: string;
  reverse?: string;
  copy?: string;
  top?: string;
  /** Jedno zdanie pokazywane tylko bez JS. */
  nojs?: string;
  /** Źródła: "Etykieta | URL". */
  link?: { label: string; url: string }[];
  colophon?: string;
};

const KNOWN = new Set(["title", "word", "word2", "line", "code", "marks", "number", "unit", "replay", "playhead", "nojs", "toggle", "pause", "play", "reverse", "copy", "top", "link", "colophon"]);

let cache: Record<string, ChapterCopy> | undefined;

function parse(src: string): Record<string, ChapterCopy> {
  const out: Record<string, ChapterCopy> = {};
  let current: ChapterCopy | undefined;
  for (const raw of src.split("\n")) {
    const line = raw.trimEnd();
    const head = /^## ([a-z]+)\s*$/.exec(line);
    if (head) {
      current = { title: "", word: "", line: "", code: [] };
      out[head[1]] = current;
      continue;
    }
    if (!current || line.startsWith("#") || !line.trim()) continue;
    const kv = /^([a-z0-9]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const [, key, value] = kv;
    if (!KNOWN.has(key)) throw new Error(`COPY.md: unknown key "${key}"`);
    if (key === "code") current.code.push(value);
    else if (key === "link") {
      const [label, url] = value.split("|").map((s) => s.trim());
      (current.link ??= []).push({ label, url });
    } else if (key === "marks") current.marks = value.split(",").map((s) => s.trim());
    else (current as unknown as Record<string, string>)[key] = value;
  }
  return out;
}

export function copy(id: ChapterId | "sources"): ChapterCopy {
  if (!cache) cache = parse(readFileSync(join(process.cwd(), "docs", "COPY.md"), "utf8"));
  const c = cache[id];
  if (!c || !c.title) throw new Error(`COPY.md: section "${id}" is missing title`);
  if (id !== "sources" && (!c.word || !c.line)) throw new Error(`COPY.md: chapter "${id}" is missing word or line`);
  const words = c.line.split(/\s+/).length;
  if (words > 15) throw new Error(`COPY.md: "${id}" line has ${words} words, max 15`);
  return c;
}
