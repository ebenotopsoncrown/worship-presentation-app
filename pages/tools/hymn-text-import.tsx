// pages/tools/hymn-text-import.tsx
import React, { useMemo, useRef, useState } from "react";
import Script from "next/script";

// Minimal styling that matches your app tone a bit
const Box: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-2xl bg-[#0d0f16] border border-zinc-800/60 p-4 shadow-lg">
    <div className="text-sm font-semibold bg-gradient-to-r from-fuchsia-500 to-indigo-500 bg-clip-text text-transparent">
      {title}
    </div>
    <div className="mt-3">{children}</div>
  </div>
);

type ImportedHymn = {
  number: number;      // 1-based
  title: string;
  verses: string[];    // each item = a verse (joined lines)
};

declare global {
  interface Window {
    mammoth?: any;
  }
}

/* -------------------------------------------------------------------------- */
/* NEW ROBUST PARSER (kept exactly as designed earlier)                       */
/* -------------------------------------------------------------------------- */
type Hymn = { id: string; title: string; verses: string[] };

function extractHymnsFromHtml(html: string): Hymn[] {
  const normalized = html
    .replace(/\r/g, "")
    .replace(/<\/p>\s*<p>/gi, "</p>\n<p>");

  const hasHeadings = /<h1|<h2/i.test(normalized);
  if (hasHeadings) return parseByHeadings(normalized);
  return parseByParagraphs(normalized);
}

function parseByHeadings(html: string): Hymn[] {
  const chunks = html.split(/<\/h1>|<\/h2>/i);
  const hymns: Hymn[] = [];

  for (const chunk of chunks) {
    const m = chunk.match(/<(h1|h2)[^>]*>([^]*?)$/i);
    if (!m) continue;

    const title = stripTags(m[2]).trim();
    if (!title) continue;

    const h: Hymn = { id: toId(title), title, verses: [] };
    const body = chunk.replace(/^(.*?<\/(h1|h2)>)/is, "");
    pushBody(body, h);

    if (h.verses.length) hymns.push(h);
  }
  return hymns;
}

function parseByParagraphs(html: string): Hymn[] {
  const blocks = html
    .split(/<\/p>/i)
    .map((s) => stripTags(s).trim())
    .filter(Boolean);

  const hymns: Hymn[] = [];
  let current: Hymn | null = null;

  for (const line of blocks) {
    if (!current) {
      if (isTitleLine(line)) {
        current = { id: toId(line), title: line, verses: [] };
        hymns.push(current);
      }
      continue;
    }

    if (isTitleLine(line)) {
      current = { id: toId(line), title: line, verses: [] };
      hymns.push(current);
      continue;
    }

    appendToVerses(current, line);
  }

  return hymns.filter((h) => h.verses.length);
}

function pushBody(rawHtml: string, h: Hymn) {
  const paras = rawHtml
    .replace(/\r/g, "")
    .split(/<\/p>/i)
    .map((s) => stripTags(s).trim())
    .filter(Boolean);

  for (const p of paras) appendToVerses(h, p);
}

function appendToVerses(h: Hymn, line: string) {
  if (/^\d+(\.|:)\s*/.test(line) || /^(Chorus|Refrain)\b/i.test(line)) {
    h.verses.push(line.replace(/^\d+(\.|:)\s*/, ""));
    return;
  }
  if (!h.verses.length) {
    h.verses.push(line);
  } else {
    h.verses[h.verses.length - 1] = `${h.verses[h.verses.length - 1]}\n${line}`.trim();
  }
}

function stripTags(s: string) {
  return s.replace(/<\/?[^>]+>/g, "");
}

function toId(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function isTitleLine(s: string) {
  if (s.length > 90) return false;
  if (/^\d+(\.|:)\s/.test(s)) return false;
  if (/^(Chorus|Refrain)\b/i.test(s)) return false;

  const letters = s.replace(/[^A-Za-z]/g, "");
  if (letters.length >= 3 && s === s.toUpperCase()) return true;

  const words = s.split(/\s+/).filter(Boolean);
  if (!words.length) return false;
  const capish = words.filter((w) => /^[A-Z]/.test(w)).length / words.length;
  return capish > 0.6 && !/[.?!]$/.test(s);
}
/* -------------------------------------------------------------------------- */

export default function HymnTextImportPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hymns, setHymns] = useState<ImportedHymn[]>([]);
  const [rawPreview, setRawPreview] = useState<string>("");

  const fileRef = useRef<HTMLInputElement>(null);

  const parsedCount = hymns.length;
  const sample = useMemo(() => hymns.slice(0, 5), [hymns]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setHymns([]);
    setRawPreview("");

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!window.mammoth) {
        setError("Mammoth script not yet loaded. Please wait a second and try again.");
        return;
      }

      setBusy(true);

      // Read file as ArrayBuffer in the browser
      const arrayBuffer = await file.arrayBuffer();

      // Convert to HTML and preserve Heading 1 / 2 so we can detect titles
      const options = {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
        ],
      };
      const { value: html } = await window.mammoth.convertToHtml(
        { arrayBuffer },
        options
      );

      // Keep a tiny preview of the raw HTML (helpful if parsing needs tweaking)
      setRawPreview(html.slice(0, 5000));

      /* >>> CHANGE: use the new robust parser first, then gracefully fall back */
      const primary = extractHymnsFromHtml(html);
      let normalized: ImportedHymn[] = primary.map((h, i) => ({
        number: i + 1,
        title: h.title,
        verses: h.verses,
      }));

      if (!normalized.length) {
        // Fallback to the older DOMParser-based approach if needed
        normalized = parseHymnsFromHtml(html);
      }

      setHymns(normalized);
      /* <<< END CHANGE */
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Your existing DOMParser-based parser kept intact (fallback path).        */
  /* ------------------------------------------------------------------------ */
  function parseHymnsFromHtml(html: string): ImportedHymn[] {
    // Parse HTML to DOM
    const doc = new DOMParser().parseFromString(html, "text/html");

    // Treat both h1 and h2 as hymn titles (depending on how Word styles were used)
    const headings = Array.from(doc.querySelectorAll("h1, h2"));

    const results: ImportedHymn[] = [];

    for (let i = 0; i < headings.length; i++) {
      const titleEl = headings[i];
      const title = clean(titleEl.textContent || "").replace(/^\d+\s*[.: -]\s*/, ""); // drop leading numbers like "1."

      // collect paragraphs until next heading
      const paras: string[] = [];
      let sib = titleEl.nextElementSibling;

      // walk forward until the next h1/h2 or end
      while (sib && !/^(H1|H2)$/.test(sib.tagName)) {
        if (sib.tagName === "P" || sib.tagName === "DIV" || sib.tagName === "SPAN") {
          const t = clean((sib.textContent || "").trim());
          if (t) paras.push(t);
        }
        sib = sib.nextElementSibling as Element | null;
      }

      const verses = splitIntoVerses(paras);

      if (title) {
        results.push({
          number: results.length + 1,
          title,
          verses: verses.length ? verses : [paras.join(" ")].filter(Boolean),
        });
      }
    }

    return results;
  }

  // Split paragraphs into verses using common patterns:
  // starts with "Verse 1", "V1", "1.", "1:", "1 -", etc.
  function splitIntoVerses(paragraphs: string[]): string[] {
    const verses: string[] = [];
    let current: string[] = [];

    const startsVerse = (line: string) =>
      /^(?:verse|v)?\s*\d+\s*[.:)\-–—]?\s*/i.test(line);

    for (const line of paragraphs) {
      if (startsVerse(line)) {
        // push current and start a new verse
        if (current.length) verses.push(current.join(" ").trim());
        current = [line.replace(/^(?:verse|v)?\s*\d+\s*[.:)\-–—]?\s*/i, "").trim()];
      } else {
        current.push(line);
      }
    }
    if (current.length) verses.push(current.join(" ").trim());

    // If we still have no verses, try splitting by blank paragraph blocks
    if (!verses.length) {
      const joined = paragraphs.join("\n").trim();
      return joined
        .split(/\n\s*\n+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return verses;
  }

  function clean(s: string) {
    return s.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
  }

  function downloadJson() {
    if (!hymns.length) return;
    // Shape your app likely expects:
    // { hymns: [{ number, title, verses }] }
    const payload = { hymns };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hymn_library.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setError(null);
    setHymns([]);
    setRawPreview("");
    fileRef.current?.value && (fileRef.current.value = "");
  }

  return (
    <>
      {/* Load the browser build of Mammoth from a CDN */}
      <Script
        src="https://unpkg.com/mammoth@1.6.0/mammoth.browser.min.js"
        strategy="beforeInteractive"
      />
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <h1 className="text-2xl font-semibold">
            Hymn Text Importer <span className="text-zinc-400 text-base">(DOCX → JSON)</span>
          </h1>

          <Box title="1) Upload your DOCX">
            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept=".docx"
                onChange={handleFileChange}
                className="text-sm file:mr-3 file:rounded-lg file:bg-fuchsia-600 file:hover:bg-fuchsia-500 file:text-white file:px-3 file:py-2 file:border-0 file:cursor-pointer"
              />
              <button
                onClick={reset}
                className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm"
              >
                Reset
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              Tip: Ensure each hymn title is formatted as <b>Heading 1</b> (or Heading 2) in Word.
              Verse lines may begin with <em>1.</em>, <em>1:</em>, <em>Verse 1</em>, etc.
            </p>
          </Box>

          <div className="grid md:grid-cols-2 gap-6">
            <Box title="2) Preview">
              {busy && <div className="text-sm text-zinc-400">Processing…</div>}
              {error && <div className="text-sm text-red-400">{error}</div>}
              {!busy && !error && !parsedCount && (
                <div className="text-sm text-zinc-400">No file processed yet.</div>
              )}
              {!!parsedCount && (
                <div className="space-y-4">
                  <div className="text-sm">
                    Parsed <b>{parsedCount}</b> hymns.
                  </div>
                  <div className="space-y-4 max-h-[420px] overflow-auto pr-2">
                    {sample.map((h) => (
                      <div
                        key={h.number}
                        className="rounded-xl bg-zinc-900/60 border border-zinc-800/60 p-3"
                      >
                        <div className="text-sm font-semibold">
                          {h.number}. {h.title}
                        </div>
                        <ol className="mt-2 list-decimal ml-6 text-sm leading-relaxed text-zinc-300 space-y-1">
                          {h.verses.map((v, i) => (
                            <li key={i}>{v}</li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Box>

            <Box title="3) Raw HTML (debug)">
              <div className="text-xs text-zinc-400 whitespace-pre-wrap max-h-[420px] overflow-auto">
                {rawPreview || "—"}
              </div>
            </Box>
          </div>

          <Box title="4) Export">
            <div className="flex items-center gap-3">
              <button
                onClick={downloadJson}
                disabled={!parsedCount}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
              >
                Download hymn_library.json
              </button>
              <div className="text-xs text-zinc-400">
                Put the file at <code>/public/data/hymn_library.json</code> in your repo and commit.
              </div>
            </div>
          </Box>
        </div>
      </div>
    </>
  );
}
