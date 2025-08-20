import React, { useMemo, useState } from 'react';
import { db, dbRef, set } from '../utils/firebase';

// If your hymns file has a different name/path, adjust this import.
// Example structure expected:
// [{ "id":"amazing-grace", "title":"Amazing Grace", "verses":["Amazing grace...", "..."] }, ...]
import hymnsData from '../data/mfm_hymns.json';

type Slot = 1 | 2 | 3 | 4;
const slotPath = (n: Slot) => `preview/${n}`;

type Hymn = {
  id: string;
  title: string;
  verses: string[];
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderHymnHtml(h: Hymn): string {
  // Large, centered lines with spacing
  return `
    <div style="font-size:64px; line-height:1.25; text-align:center;">
      ${h.verses.map(v => `<div style="margin:16px 0">${escapeHtml(v)}</div>`).join('')}
    </div>
  `;
}

export default function HymnDisplay() {
  const [q, setQ] = useState('');
  const [slot, setSlot] = useState<Slot>(1);

  const hymns: Hymn[] = (hymnsData as any) as Hymn[];
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return hymns;
    return hymns.filter(h =>
      h.title.toLowerCase().includes(needle) ||
      h.verses.some(v => v.toLowerCase().includes(needle))
    );
  }, [q, hymns]);

  const sendToPreview = async (h: Hymn) => {
    const html = renderHymnHtml(h);
    await set(dbRef(db, slotPath(slot)), {
      html,
      at: Date.now(),
      kind: 'hymn',
      title: h.title,
    });
  };

  return (
    <section>
      <h2>Hymns</h2>

      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="Search hymns…"
          style={{ padding:'6px 10px', minWidth:260 }}
        />
        <label>Send to</label>
        <select value={slot} onChange={e=>setSlot(Number(e.target.value) as Slot)}>
          <option value={1}>Preview 1</option>
          <option value={2}>Preview 2</option>
          <option value={3}>Preview 3</option>
          <option value={4}>Preview 4</option>
        </select>
      </div>

      <ul style={{ listStyle:'none', padding:0, margin:0 }}>
        {filtered.map(h => (
          <li key={h.id} style={{ margin:'8px 0' }}>
            <button
              style={{ padding:'6px 10px', marginRight:10 }}
              onClick={() => sendToPreview(h)}
              title="Send the whole hymn to the selected preview"
            >
              Send to Preview
            </button>
            <strong>{h.title}</strong>
          </li>
        ))}
        {filtered.length === 0 && <li>No hymns found.</li>}
      </ul>
    </section>
  );
}
