'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { db, dbRef, set } from '../utils/firebase';

type Hymn = {
  id: string; number: number; title: string; firstLine: string;
  verses: string[][]; chorus?: string[]; searchTokens?: string[];
};

const asArr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const asStr = (v: unknown): string => (typeof v === 'string' ? v : '');

export default function HymnDisplay() {
  const [library, setLibrary] = useState<Hymn[]>([]);
  const [q, setQ] = useState('');
  const [slot, setSlot] = useState<1 | 2 | 3 | 4>(1);
  const [selected, setSelected] = useState<Hymn | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const mod: any = await import('../data/mfm_hymns.json');
        const raw = mod?.default ?? mod;
        const hymns = Array.isArray(raw) ? raw : asArr<Hymn>(raw?.hymns);
        setLibrary(hymns);
      } catch (e) {
        console.error('[HymnDisplay] failed to load hymn library', e);
        setLibrary([]);
      }
    })();
  }, []);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return library.slice(0, 40);
    if (/^\d+$/.test(s)) return library.filter(h => String(h.number).startsWith(s)).slice(0, 60);
    return library
      .filter(h => {
        const title = asStr(h.title).toLowerCase();
        const first  = asStr(h.firstLine).toLowerCase();
        const tokens = asArr<string>(h.searchTokens ?? []);
        return title.includes(s) || first.includes(s) || tokens.some(t => asStr(t).toLowerCase().startsWith(s));
      })
      .slice(0, 60);
  }, [q, library]);

  const previewHtml = useMemo(() => {
    if (!selected) return '<div style="opacity:.6">Select a hymn to preview…</div>';
    const verses = asArr<string[]>(selected.verses).map(v => asArr<string>(v));
    const chorus = asArr<string>(selected.chorus);
    const blocks: string[] = [];
    blocks.push(`<h2 style="margin:0 0 .25em 0">${escapeHtml(selected.title)}</h2>`);
    verses.forEach(v => blocks.push(`<p>${v.map(l => escapeHtml(l)).join('<br/>')}</p>`));
    if (chorus.length) blocks.push(`<p><em>${chorus.map(l => escapeHtml(l)).join('<br/>')}</em></p>`);
    return blocks.join('');
  }, [selected]);

  const send = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await set(dbRef(db, `preview_slots/slot${slot}`), {
        id: String(Date.now()),
        kind: 'hymn',
        title: `${selected.number}. ${selected.title}`,
        html: previewHtml,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <div className="panel-title">Hymns</div>

      <div style={{ display:'flex', gap:8, marginBottom:10, alignItems:'center' }}>
        <input
          placeholder="Search by number, title, or first line…"
          value={q} onChange={(e) => setQ(e.target.value)}
          style={{ flex:1, padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,.12)', background:'rgba(0,0,0,.25)', color:'inherit' }}
        />
        <select value={slot} onChange={e => setSlot(Number(e.target.value) as 1|2|3|4)}>
          {[1,2,3,4].map(n => <option key={n} value={n}>Preview {n}</option>)}
        </select>
        <button onClick={send} disabled={!selected || busy}
          style={{ padding:'6px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.08)', opacity: (!selected || busy) ? .6 : 1 }}>
          {busy ? 'Sending…' : 'Send to Preview'}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div style={{ maxHeight:260, overflow:'auto', border:'1px solid rgba(255,255,255,.12)', borderRadius:10, padding:8, background:'rgba(0,0,0,.25)' }}>
          {library.length === 0 ? (
            <div style={{ opacity:.7 }}>No hymn library found. Ensure <code>/data/mfm_hymns.json</code> exists.</div>
          ) : results.length === 0 ? (
            <div style={{ opacity:.7 }}>No hymns match “{q}”.</div>
          ) : (
            <ul style={{ listStyle:'none', padding:0, margin:0 }}>
              {results.map(h => (
                <li key={h.id} onClick={() => setSelected(h)}
                    style={{ padding:'6px 8px', borderRadius:8, cursor:'pointer',
                             background: selected?.id === h.id ? 'rgba(255,255,255,.12)' : 'transparent' }}>
                  <div style={{ fontWeight:600 }}>{h.number}. {h.title}</div>
                  <div style={{ opacity:.65, fontSize:'.9rem' }}>{h.firstLine}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Preview box inside Hymns */}
        <div style={{ minHeight:260, border:'1px solid rgba(255,255,255,.12)', borderRadius:10, padding:12, background:'rgba(0,0,0,.35)' }}
             dangerouslySetInnerHTML={{ __html: previewHtml }} />
      </div>
    </div>
  );
}
function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]!));
}
