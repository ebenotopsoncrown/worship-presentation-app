import React from 'react';
import { setPreviewSlot } from '../utils/firebase';

type Hymn = {
  id: string;
  number?: number;
  title?: string;
  firstLine?: string;
  verses: string[] | string[][];
  chorus?: string[];
};

function fuseScore(h: Hymn, q: string) {
  const s = q.toLowerCase();
  const tokens = [h.title, h.firstLine, String(h.number || '')].join(' ').toLowerCase();
  return tokens.includes(s) ? 1 : 0;
}

export default function HymnDisplay() {
  const [all, setAll] = React.useState<Hymn[]>([]);
  const [q, setQ] = React.useState('');
  const [slot, setSlot] = React.useState<number>(1);
  const [selected, setSelected] = React.useState<Hymn | null>(null);

  React.useEffect(() => {
    const { db, ref, onValue } = require('../utils/firebase');
    const r = ref(db, 'hymn_library');
    const off = onValue(r, (snap: any) => {
      const val = snap.val() || {};
      const list: Hymn[] = Object.keys(val).map((k) => ({ id: k, ...val[k] }));
      setAll(list);
    });
    return () => off();
  }, []);

  const results = React.useMemo(() => {
    if (!q) return all.slice(0, 50);
    return all
      .map((h) => ({ h, s: fuseScore(h, q) }))
      .filter(({ s }) => s > 0)
      .sort((a, b) => b.s - a.s)
      .map(({ h }) => h)
      .slice(0, 50);
  }, [all, q]);

  const send = async () => {
    if (!selected) return;

    const versesArray = Array.isArray(selected.verses?.[0])
      ? (selected.verses as string[][])
      : (selected.verses as string[]).map((v) => [v]);

    const slides = versesArray.map(
      (stanza) =>
        `<div style="font-size:2.6rem;line-height:1.2">${stanza.map((l) => l).join('<br/>')}</div>`
    );

    if (selected.chorus && selected.chorus.length) {
      slides.splice(1, 0, `<div style="font-size:2.6rem;line-height:1.2"><em>${selected.chorus.join('<br/>')}</em></div>`);
    }

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
    <div className="panel panel--hymns">
      <div className="panel-header">Hymns</div>

      <div className="flex items-center gap-2 mb-2">
        <input
          className="field w-full"
          placeholder="Search by number, title, or first line…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="select" value={slot} onChange={(e) => setSlot(parseInt(e.target.value, 10))}>
          <option value={1}>Preview 1</option>
          <option value={2}>Preview 2</option>
          <option value={3}>Preview 3</option>
          <option value={4}>Preview 4</option>
        </select>
        <button onClick={send} disabled={!selected} className="btn btn-green">
          Send to Preview
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* results list with scroll */}
        <div className="preview-frame">
          {!results.length ? (
            <div className="text-zinc-400 text-sm">No hymns match “{q}”.</div>
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

        {/* hymn preview area with scroll */}
        <div className="preview-frame">
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
                    <div className="whitespace-pre-line">{stanza.join('\n')}</div>
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
            <div className="text-zinc-400 text-sm">Select a hymn to preview…</div>
          )}
        </div>
      </div>
    </div>
  );
}
