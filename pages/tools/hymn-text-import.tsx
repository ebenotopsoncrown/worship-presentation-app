'use client';

import React, { useCallback, useMemo, useState } from 'react';

/** Data shape your app already understands */
type Hymn = {
  number: number;
  title: string;
  verses: string[]; // one item per verse (strings or line arrays both work, but we use strings)
};

type ImportResult = {
  hymns: Hymn[];
};

function clean(s: string): string {
  return (s || '')
    .replace(/\u00A0/g, ' ') // &nbsp;
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .trim();
}

/**
 * Split a raw hymn body into ["verse 1 text", "verse 2 text", ...]
 * Supports two common patterns:
 *  - Numbered verses: 1. ... 2. ... 3. ...
 *  - Blank-line separated paragraphs (each block = a verse)
 */
function splitIntoVerses(raw: string): string[] {
  if (!raw) return [];

  // Normalise breaks from mammoth HTML
  let txt = raw
    .replace(/\r/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n')
    .replace(/<\/?p[^>]*>/gi, '\n')
    .replace(/<\/?strong[^>]*>/gi, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Do we see numbered markers like "1." "2)" at the start of lines?
  const hasNumbered = /(^|\n)\s*\d{1,2}\s*[\.\)]\s+/.test(txt);
  let verses: string[];

  if (hasNumbered) {
    // Split at verse labels (lookahead keeps the delimiter on the new block)
    verses = txt
      .split(/(?=(^|\n)\s*\d{1,2}\s*[\.\)]\s+)/g)
      .map(block =>
        block
          .replace(/(^|\n)\s*\d{1,2}\s*[\.\)]\s+/, '') // remove the "1." / "2)" prefix
          .trim()
      )
      .filter(Boolean);
  } else {
    // Fallback: split on blank lines
    verses = txt
      .split(/\n\s*\n+/g)
      .map(v => v.trim())
      .filter(Boolean);
  }

  // Final tidy inside each verse
  verses = verses.map(v =>
    v
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{2,}/g, '\n')
      .trim()
  );

  return verses;
}

/**
 * Extract hymns from Mammoth-produced HTML.
 * Titles are taken from H1/H2. As a fallback we detect a bold-only paragraph as a title.
 */
function extractHymnsFromHtml(html: string): Hymn[] {
  const container = document.createElement('div');
  container.innerHTML = html;

  const hymns: Hymn[] = [];
  let currentTitle = '';
  let currentBodyParts: string[] = [];

  const flush = () => {
    const bodyText = clean(currentBodyParts.join('\n').trim());
    const verses = splitIntoVerses(bodyText);
    const title = clean(currentTitle);
    if (title && verses.length) {
      hymns.push({
        number: hymns.length + 1,
        title,
        verses,
      });
    }
    currentTitle = '';
    currentBodyParts = [];
  };

  // We only walk top-level blocks that Mammoth typically emits: p, h1, h2, h3, etc.
  const blocks = Array.from(container.querySelectorAll('h1,h2,h3,p,div,ul,ol,li'));

  for (const el of blocks) {
    const tag = el.tagName.toLowerCase();

    // Title markers: h1/h2 are the primary signal
    if (tag === 'h1' || tag === 'h2') {
      if (currentTitle || currentBodyParts.length) flush();
      currentTitle = el.textContent || '';
      continue;
    }

    // Fallback: a paragraph that is "strong-only" can be a title in some docs
    if (
      tag === 'p' &&
      el.childNodes.length > 0 &&
      Array.from(el.childNodes).every(
        n =>
          (n.nodeType === Node.ELEMENT_NODE &&
            (n as HTMLElement).tagName.toLowerCase() === 'strong') ||
          n.textContent?.trim() === ''
      )
    ) {
      if (currentTitle || currentBodyParts.length) flush();
      currentTitle = el.textContent || '';
      continue;
    }

    // Otherwise treat as body
    if (tag === 'p' || tag === 'div' || tag === 'li') {
      const t = clean(el.textContent || '');
      if (t) currentBodyParts.push(t);
    }
  }

  // Flush last hymn
  if (currentTitle || currentBodyParts.length) flush();

  // Only keep hymns that have both title and at least one verse
  return hymns.filter(h => h.title && h.verses.length > 0);
}

/** Download helper */
function downloadJson(data: any, filename = 'hymn_library.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HymnTextImportPage() {
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [rawHtml, setRawHtml] = useState<string>('');
  const [parsed, setParsed] = useState<Hymn[]>([]);

  const onReset = useCallback(() => {
    setFileName('');
    setRawHtml('');
    setParsed([]);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    onReset();
    if (!file) return;
    setBusy(true);
    try {
      setFileName(file.name);
      const arrayBuffer = await file.arrayBuffer();

      // lazy-load mammoth on client only
      const mammoth = await import('mammoth/mammoth.browser');
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

      setRawHtml(html || '');
      const hymns = extractHymnsFromHtml(html || '');
      setParsed(hymns);
    } catch (err) {
      console.error(err);
      alert('Failed to read/convert that DOCX. Please ensure it is a valid Word file.');
    } finally {
      setBusy(false);
    }
  }, [onReset]);

  const resultJson: ImportResult = useMemo(
    () => ({ hymns: parsed }),
    [parsed]
  );

  return (
    <div className="min-h-screen bg-[#0f1115] text-zinc-200">
      {/* Header bar (matches your app’s look) */}
      <header className="sticky top-0 z-10 w-full border-b border-white/10 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 px-5 py-3">
        <div className="mx-auto max-w-6xl font-semibold">
          Worship Presentation App — MFM Goshen Assembly
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <h1 className="text-xl font-semibold">Hymn Text Importer <span className="text-sm text-zinc-400">(DOCX → JSON)</span></h1>

        {/* 1) Upload */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-sm font-medium text-zinc-300">1) Upload your DOCX</div>
          <div className="flex items-center gap-3">
            <label className="inline-flex cursor-pointer items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium hover:bg-indigo-500">
              <input
                type="file"
                accept=".docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
              Choose file
            </label>

            <div className="text-sm text-zinc-400">{fileName || 'No file chosen'}</div>

            <button
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              onClick={onReset}
              disabled={busy}
            >
              Reset
            </button>
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            Tip: Make each hymn title a <strong>Heading 1 or Heading 2</strong> in Word.
            Begin verses with <strong>1.</strong> <strong>2.</strong> etc., or separate verses with a <strong>blank line</strong>.
          </p>
        </section>

        {/* 2) Preview parsed hymns */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-sm font-medium text-zinc-300">
            2) Preview <span className="text-zinc-500">({parsed.length ? `Parsed ${parsed.length} hymns.` : 'No file processed yet.'})</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <textarea
              readOnly
              className="h-72 w-full resize-none rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs text-zinc-300"
              value={
                parsed.length
                  ? parsed
                      .map(
                        (h) =>
                          `${h.number}. ${h.title}\n${h.verses
                            .map((v, i) => `${i + 1}. ${v}`)
                            .join('\n')}\n`
                      )
                      .join('\n')
                  : ''
              }
              placeholder="Parsed hymns will appear here…"
            />
            <textarea
              readOnly
              className="h-72 w-full resize-none rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs text-purple-200/90"
              value={rawHtml}
              placeholder="Raw HTML (debug)…"
            />
          </div>
        </section>

        {/* 3) Export */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-sm font-medium text-zinc-300">3) Export</div>
          <button
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            onClick={() => downloadJson(resultJson, 'hymn_library.json')}
            disabled={!parsed.length || busy}
          >
            Download hymn_library.json
          </button>
          <p className="mt-3 text-xs text-zinc-500">
            Put the file at <code className="rounded bg-black/50 px-1 py-0.5">/public/data/hymn_library.json</code> in your repo and commit.
          </p>
        </section>
      </main>
    </div>
  );
}
