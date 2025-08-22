import { useState } from 'react';
import { db, dbRef, set } from '../utils/firebase';

type Slot = 1 | 2 | 3 | 4;

export default function SlidesMini() {
  const [title, setTitle] = useState<string>('Welcome');
  const [text, setText] = useState<string>('Welcome to church!');
  const [slot, setSlot] = useState<Slot>(1);
  const [busy, setBusy] = useState(false);

  import { setPreviewSlot } from '../utils/firebase';
// ...
const send = async () => {
  await setPreviewSlot(slot, {
    id: `slides-${Date.now()}`,
    kind: 'slides',
    title,
    html: `<div style="font-size:52px; line-height:1.22">${text.replace(/\n/g,'<br/>')}</div>`
  });
};


  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Slide title"
          style={{
            flex: '1 1 200px',
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,.15)',
            background: 'rgba(255,255,255,.08)',
            color: '#e5e7eb',
          }}
        />
        <span style={{ opacity: 0.7 }}>Send to</span>
        <select
          value={slot}
          onChange={(e) => setSlot(Number(e.target.value) as Slot)}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            background: 'rgba(255,255,255,.08)',
            color: '#e5e7eb',
            border: '1px solid rgba(255,255,255,.15)',
          }}
        >
          <option value={1}>Preview 1</option>
          <option value={2}>Preview 2</option>
          <option value={3}>Preview 3</option>
          <option value={4}>Preview 4</option>
        </select>
        <button
          onClick={send}
          disabled={busy}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            background: 'rgba(255,255,255,.08)',
            color: '#e5e7eb',
            border: '1px solid rgba(255,255,255,.12)',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'Sending…' : 'Send to Preview'}
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          width: '100%',
          minHeight: 120,
          padding: '10px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,.15)',
          background: 'rgba(255,255,255,.08)',
          color: '#e5e7eb',
        }}
      />
    </div>
  );
}

