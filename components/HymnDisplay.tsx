import React from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { setPreviewSlot } from '../utils/firebase';
import { db } from '../utils/firebase';

type Hymn = {
  id: string;
  title?: string;
  number?: number;
  verses: string[][] | string[];
  chorus?: string[];
  firstLine?: string;
  searchTokens?: string[];
};

function hymnToSlides(h: Hymn) {
  const mk = (html: string) =>
    `<div style="font-size:2.6rem;line-height:1.2">${html}</div>`;

  const slides: string[] = [];
  const verses: string[][] =
    Array.isArray(h.verses?.[0]) ? (h.verses as string[][])
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
  const s = q.toLowerCase();
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
  const [slot, setSlot] = React.useState<number>(1);
  const [selected, setSelected] = React.useState<Hymn | null>(null);

  // Load hymn library from Firebase (/hymn_library)
  React.useEffect(() => {
    const r = ref(db, 'hymn_library');
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
    if (slot === 1) {
      await setPreviewSlot(1, {
        kind: 'slides',
        slides,
        index: 0,
        meta: { type: 'hymn', number: selected.number, title: selected.title },
      });
    } else {
      const whole = slides.join('<!-- slide -->');
      await setPreviewSlot(slot, {
        html: whole,
        meta: { type: 'hymn', number: selected.number, title: selected.title },
      });
    }
  };

  return (
    <div className="bg-zinc-900 rounded-2xl p-4 shadow-inner border border-zinc-800">
      <div className="text-zinc-200 font-semibold mb-3">Hymns</div>

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
          onChange={(e) => setSlot(parseInt(e.target.value, 10))}
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

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/40 rounded-xl h-[220px] overflow-auto p-2">
          {!results.length ? (
            <div className="text-zinc-500 text-sm">No hymns match “{q}”.</div>
          ) : (
            <ul className="space-y-1">
              {results.map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() => setSelected(h)}
                    className={`w-full text-left px-2 py-1 rounded hover:bg-zinc-800 ${
                      selected?.id === h.id ? 'bg-zinc-800' : ''
                    }`}
                  >
                    <div className="text-sm">
                      <span className="opacity-70 mr-2">{h.number ?? ''}</span>
                      {h.title || h.firstLine}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-black/40 rounded-xl h-[220px] overflow-auto p-3">
          {selected ? (
            <>
              <div className="text-sm opacity-70 mb-1">
                Hymn {selected.number ?? ''} • {selected.title ?? selected.firstLine ?? ''}
              </div>
              <div className="space-y-3">
                {(Array.isArray(selected.verses?.[0])
                  ? (selected.verses as string[][])
                  : (selected.verses as string[]).map((v) => [v])
                ).map((stanza, i) => (
                  <div key={i} className="text-zinc-100">
                    <div className="opacity-70 text-xs mb-1">Verse {i + 1}</div>
                    <div className="whitespace-pre-line">
                      {stanza.join('\n')}
                    </div>
                  </div>
                ))}
                {selected.chorus && selected.chorus.length > 0 && (
                  <div className="text-zinc-100">
                    <div className="opacity-70 text-xs mb-1">Chorus</div>
                    <div className="whitespace-pre-line">{selected.chorus.join('\n')}</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-zinc-500 text-sm">Select a hymn to preview…</div>
          )}
        </div>
      </div>
    </div>
  );
}
