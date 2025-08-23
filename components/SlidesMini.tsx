import { useState } from 'react';
import { db, dbRef, set } from '../utils/firebase';

type Slot = 1 | 2 | 3 | 4;

export default function SlidesMini() {
  const [title, setTitle] = useState('Welcome');
  const [text, setText] = useState('Welcome to church!');
  const [slot, setSlot] = useState<Slot>(2);

  const send = async () => {
    await set(dbRef(db, `preview_slots/slot${slot}`), {
      id: `slides-${Date.now()}`,
      kind: 'slides',
      title,
      html: `<div style="font-size:52px; line-height:1.22">${text.replace(/\n/g, '<br/>')}</div>`,
    });
  };

  return (
    <div className="panel panel--slides">
      <div className="panel-header">Slides</div>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Slide title"
          className="field min-w-[220px] flex-1"
        />
        <span className="opacity-70">Send to</span>
        <select value={slot} onChange={(e) => setSlot(Number(e.target.value) as Slot)} className="select">
          <option value={1}>Preview 1</option>
          <option value={2}>Preview 2</option>
          <option value={3}>Preview 3</option>
          <option value={4}>Preview 4</option>
        </select>
        <button onClick={send} className="btn btn-green">Send to Preview</button>
      </div>

      {/* make editor scroll if text grows */}
      <div className="preview-frame">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-full bg-transparent outline-none resize-none"
        />
      </div>
    </div>
  );
}
