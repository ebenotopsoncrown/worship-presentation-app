'use client';
import { useMemo, useState } from 'react';
import { db, dbRef, set } from '../utils/firebase';

type Slot = 1 | 2 | 3 | 4;
type Version = 'KJV' | 'NIV' | 'ESV';

const asArr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const asStr = (v: unknown): string => (typeof v === 'string' ? v : '');

export default function BibleDisplay() {
  const [ref, setRef] = useState('John 3:16-18');
  const [ver, setVer] = useState<Version>('KJV');
  const [slot, setSlot] = useState<Slot>(1);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ title: string; lines: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchVerses = async (reference: string, version: Version) => {
    try {
      const q = encodeURIComponent(reference.trim());
      const r = await fetch(`/api/bible?q=${q}&v=${version}`);
      if (!r.ok) throw new Error('Bible API failed');
      const json = (await r.json()) as { lines?: unknown; title?: unknown };
      const title = asStr(json.title) || `${reference} (${version})`;
      const lines = asArr<string>(json.lines);
      return { title, lines: lines.length ? lines : [`[No verses returned] ${reference} (${version})`] };
    } catch {
      return { title: `${reference} (${version})`, lines: [`[Bible API not configured] ${reference} (${version})`] };
    }
  };

  const loadPreview = async () => {
    setLoading(true);
    try { setPreview(await fetchVerses(ref, ver)); }
    finally { setLoading(false); }
  };

  const send = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const data = preview ?? await fetchVerses(ref, ver);
      await set(dbRef(db, `preview_slots/slot${slot}`), {
        id: `${Date.now()}-bible`,
        kind: 'bible',
        title: data.title,
        lines: asArr<string>(data.lines),
        groupSize: 2,
      });
    } finally { setBusy(false); }
  };

  const previewHtml = useMemo(() => {
    if (!preview) return '<div style="opacity:.6">Click Preview to load the passage…</div>';
    return `<h2 style="margin:0 0 .25em 0">${escapeHtml(preview.title)}</h2><p>${preview.lines.map(escapeHtml).join('<br/>')}</p>`;
  }, [preview]);

  return (
    <>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:8 }}>
        <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. John 3:16-18"
          style={{ minWidth:220, flex:'1 1 220px', padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.08)', color:'#e5e7eb' }} />
        <select value={ver} onChange={(e) => setVer(e.target.value as Version)}
          style={{ padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,.08)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,.15)' }}>
          <option>KJV</option><option>NIV</option><option>ESV</option>
        </select>
        <button onClick={loadPreview} disabled={loading}
          style={{ padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,.08)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,.12)', opacity: loading ? .6 : 1 }}>
          {loading ? 'Loading…' : 'Preview'}
        </button>
        <span style={{ opacity:.7 }}>→</span>
        <select value={slot} onChange={(e) => setSlot(Number(e.target.value) as Slot)}
          style={{ padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,.08)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,.15)' }}>
          <option value={1}>Preview 1</option><option value={2}>Preview 2</option><option value={3}>Preview 3</option><option value={4}>Preview 4</option>
        </select>
        <button disabled={busy} onClick={send}
          style={{ padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,.08)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,.12)', opacity: busy ? .6 : 1 }}>
          {busy ? 'Sending…' : 'Send to Preview'}
        </button>
      </div>

      {/* Preview box inside Bible */}
      <div style={{ minHeight:160, border:'1px solid rgba(255,255,255,.12)', borderRadius:10, padding:12, background:'rgba(0,0,0,.35)' }}
           dangerouslySetInnerHTML={{ __html: previewHtml }} />
    </>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]!));
}
