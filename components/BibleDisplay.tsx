import React, { useState } from 'react';
import { db, dbRef, set } from '../utils/firebase';

type Slot = 1 | 2 | 3 | 4;
const slotPath = (n: Slot) => `preview/${n}`;

type Verse = { ref: string; text: string }; // simple shape we’ll render

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderBibleHtml(input: string, version: string, verses: Verse[]): string {
  return `
    <div style="font-size:64px; line-height:1.25; text-align:center;">
      <div style="font-size:28px; opacity:.85; margin-bottom:16px">${escapeHtml(input)} (${escapeHtml(version.toUpperCase())})</div>
      ${verses.map(v => `<div style="margin:16px 0">${escapeHtml(v.text)}</div>`).join('')}
    </div>
  `;
}

/**
 * NOTE:
 * This component assumes you already had a way to fetch verses.
 * Below is a very small, safe placeholder that just treats the input as a single “verse”
 * so the Send to Preview wiring is demonstrable and won’t 404 during deployment.
 * If you already have a working fetch, keep it and only reuse `renderBibleHtml(...)`
 * + `sendToPreview(...)` parts.
 */
export default function BibleDisplay() {
  const [input, setInput] = useState('John 3:16-18');
  const [version, setVersion] = useState<'KJV' | 'ASV' | 'WEB'>('KJV');
  const [slot, setSlot] = useState<Slot>(1);
  const [verses, setVerses] = useState<Verse[]>([{ ref: 'John 3:16-18', text: 'For God so loved the world…' }]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Replace this with your existing fetch-to-verses logic if you already have one.
  const fetchVerses = async () => {
    setErr('');
    setLoading(true);
    try {
      // TODO: swap with your real fetch logic. We just echo input here.
      // Keep `setVerses(...)` with a normalized Verse[] shape.
      setVerses([{ ref: input, text: `(${version}) ${input}` }]);
    } catch (e: any) {
      setErr('Failed to fetch passage');
    } finally {
      setLoading(false);
    }
  };

  const sendToPreview = async () => {
    const html = renderBibleHtml(input, version, verses);
    await set(dbRef(db, slotPath(slot)), {
      html,
      at: Date.now(),
      kind: 'bible',
      title: input
    });
  };

  return (
    <section style={{ marginTop:24 }}>
      <h2>Bible</h2>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:10 }}>
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          placeholder="e.g., John 3:16-18 or Psalm 23"
          style={{ padding:'6px 10px', minWidth:240 }}
        />
        <select value={version} onChange={e=>setVersion(e.target.value as any)}>
          <option value="KJV">KJV</option>
          <option value="ASV">ASV</option>
          <option value="WEB">WEB</option>
        </select>

        <button onClick={fetchVerses} disabled={loading}>
          {loading ? 'Loading…' : 'Fetch'}
        </button>

        <label>Send to</label>
        <select value={slot} onChange={e=>setSlot(Number(e.target.value) as Slot)}>
          <option value={1}>Preview 1</option>
          <option value={2}>Preview 2</option>
          <option value={3}>Preview 3</option>
          <option value={4}>Preview 4</option>
        </select>
        <button onClick={sendToPreview}>Send to Preview</button>
      </div>

      {err && <div style={{ color:'#fda4af' }}>{err}</div>}

      <div style={{ fontSize:14, opacity:.85 }}>
        <strong>Preview of fetched text:</strong>
        <div style={{ marginTop:6, padding:10, background:'#0b1220', border:'1px solid #334155', borderRadius:8 }}>
          {verses.map((v, i) => <div key={i} style={{ margin:'6px 0' }}>{v.text}</div>)}
        </div>
      </div>
    </section>
  );
}
