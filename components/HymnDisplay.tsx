// components/HymnDisplay.tsx
'use client';

import React from 'react';
import { setPreviewSlot, type Slot, db, ref, onValue } from '../utils/firebase';

type Hymn = {
  id: string;
  number?: number;
  title?: string;
  firstLine?: string;
  verses: string[] | string[][];
  chorus?: string[];
  searchTokens?: string[];
};

function hymnToSlides(h: Hymn) {
  const mk = (html: string) =>
    `<div style="font-size:2.6rem;line-height:1.2">${html}</div>`;

  const slides: string[] = [];
  const verses: string[][] = Array.isArray(h.verses?.[0])
    ? (h.verses as string[][])
    : (h.verses as string[]).map((v) => [v]);

  verses.forEach((lines, i) => {
    const head = `<div style="font-size:1rem;opacity:.7;margin-bottom:.25rem">
      Hymn ${h.number ?? ''} — Verse ${i + 1}${h.title ? ` — ${h.title}` : ''}</div>`;
    const body = lines.map((l) => l.trim()).filter(Boolean).join('<br/>');
    slides.push(mk(head + body));
    if (h.chorus && h.chorus.length) {
      slides.push(
        mk(
          `<div style="font-size:1rem;opacity:.7;margin-bottom:.25rem">Chorus</div>${h.chorus.join(
            '<br/>'
          )}`
        )
      );
    }
  });

  return slides.length ? slides : [mk(h.title || `Hymn ${h.number ?? ''}`)];
}

function fuseScore(h: Hymn, q: string) {
  const hay = (h.searchTokens || [h.title, h.firstLine, String(h.number || '')])
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const s = q.toLowerCase().trim();
  if (!s) return 0;
  let score = 0;
  if (hay.includes(s)) score += 10;
  if ((h.title || '').toLowerCase().startsWith(s)) score += 5;
  if (String(h.number || '') === s) score += 8;
  return score;
}

export default function HymnDisplay() {
  const [all, setAll] = React.useState<Hymn[]>([]);
  const [q, setQ] = React.useState('');
  const [slot, setSlot] = React.useState<Slot>(1);
  const [selected, setSelected] = React.useState<Hymn | null>(null);

  // Load hymns from RTDB: /hymns
  React.useEffect(() => {
    const r = ref(db, 'hymns');
    const off = onValue(r, (snap) => {
      const val = snap.val() || {};
      const list: Hymn[] = Object.keys(val).map((k) => ({ id: k, ...val[k] }));
      setAll(list);
    });
    return () => off();
  }, []);

  const results = React.useMemo(() => {
    if (!q) return all.slice(0, 50);
    const scored = all
      .map((h) => ({ h, s: fuseScore(h, q) }))
      .filter(({ s }) => s > 0)
      .sort((a, b) => b.s - a.s)
      .map(({ h }) => h);
    return scored.slice(0, 50);
  }, [all, q]);

  const send = async () => {
    if (!selected) return;
    const slides = hymnToSlides(selected);
    // Slot 1 supports slide-sets
    if (slot === 1) {
      await setPreviewSlot(1, {
        kind: 'slides',
        slides,
        index: 0,
        meta: { type: 'hymn', number: selected.number, title: selected.title },
      });
    } else {
      // Other slots: flatten to single HTML
      const whole = slides.join('<!-- slide -->');
      await setPreviewSlot(slot, {
        type: 'html',
        content: whole,
        meta: { type: 'hymn', number: selected.number, title: selected.title },
      });
    }
  };

  return (
    <div className="panel panel--hymns h-[520px] flex flex-col">
      <div className="panel-header">Hymns</div>

      <div className="flex items-center gap-2 mb-2">
        <input
          className="w-full bg-zinc-800 rounded px-3 py-2 outline-none"
          placeholder="Search by number, title, or first line…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="bg-zinc-800 rounded px-2 py-2"
          value={slot}
          onChange={(e) => setSlot(Number(e.target.value) as Slot)}
        >
          <option value={1}>Preview 1</option>
          <option value={2}>Preview 2</option>
          <option value={3}>Preview 3</option>
          <option value={4}>Preview 4</option>
        </select>
        <button
          onClick={send}
          disabled={!selected}
          className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-zinc-700"
        >
          Send to Preview
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
        {/* results list */}
        <div className="bg-black/40 rounded-xl h-full overflow-auto p-2">
          {!results.length ? (
            <div className="text-zinc-500 p-2">No results…</div>
          ) : (
            <ul className="space-y-1">
              {results.map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() => setSelected(h)}
                    className={`w-full text-left px-2 py-1.5 rounded hover:bg-zinc-800 ${
                      selected?.id === h.id ? 'bg-zinc-800' : ''
                    }`}
                  >
                    <div className="text-zinc-200">
                      {h.number ? `${h.number}. ` : ''}
                      {h.title || h.firstLine}
                    </div>
                    {h.firstLine && (
                      <div className="text-xs text-zinc-400">{h.firstLine}</div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* preview */}
        <div className="bg-black/40 rounded-xl h-full overflow-auto p-3 flex items-center justify-center">
          {selected ? (
            <div
              className="w-full text-center text-zinc-50 text-3xl md:text-4xl leading-tight"
              // Only for preview: render first slide
              dangerouslySetInnerHTML={{
                __html: hymnToSlides(selected)[0] || '',
              }}
            />
          ) : (
            <div className="text-zinc-500">Select a hymn to preview…</div>
          )}
        </div>
      </div>
    </div>
  );
}
