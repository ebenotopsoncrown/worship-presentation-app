// components/SlidesMini.tsx
'use client';

import React from 'react';
import { setPreviewSlot, type Slot } from '../utils/firebase';

type Align = 'left' | 'center' | 'right';

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]!));

export default function SlidesMini() {
  const [slot, setSlot] = React.useState<Slot>(2);
  const [imgDataUrl, setImgDataUrl] = React.useState<string | null>(null);

  const [text, setText] = React.useState('Welcome to church!');
  const [font, setFont] = React.useState('Inter');
  const [size, setSize] = React.useState(64);
  const [bold, setBold] = React.useState(true);
  const [italic, setItalic] = React.useState(false);
  const [align, setAlign] = React.useState<Align>('center');
  const [color, setColor] = React.useState('#ffffff');

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const onPickFile = () => fileInputRef.current?.click();

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) {
      alert('Only images are supported here. Export slides as images first.');
      e.currentTarget.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImgDataUrl(String(reader.result || ''));
    reader.readAsDataURL(f);
  };

  const buildTextHtml = () => {
    const fw = bold ? 700 : 400;
    const fs = italic ? 'italic' : 'normal';
    const ta = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
    return `
<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:${align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'};text-align:${ta};">
  <div style="font-family:${font}, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;font-weight:${fw};font-style:${fs};font-size:${size}px;color:${color};line-height:1.1;padding:1rem;width:100%;">
    ${escapeHtml(text).replace(/\n/g, '<br/>')}
  </div>
</div>`;
  };

  const send = async () => {
    if (imgDataUrl) {
      await setPreviewSlot(slot, { type: 'image', content: imgDataUrl });
      return;
    }
    if (text.trim()) {
      await setPreviewSlot(slot, { type: 'html', content: buildTextHtml() });
    }
  };

  return (
    <div className="space-y-2">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      <div className="flex items-center gap-2">
        <input
          className="w-full bg-zinc-800 rounded px-3 py-2 outline-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Slide text…"
        />
        <button className="px-3 py-2 rounded bg-zinc-700 hover:bg-zinc-600" onClick={onPickFile}>
          Insert image/slide
        </button>
      </div>

      <div className="flex items-center gap-2">
        <select className="bg-zinc-800 rounded px-2 py-2" value={font} onChange={(e) => setFont(e.target.value)}>
          <option>Inter</option><option>Arial</option><option>Georgia</option><option>Times New Roman</option>
        </select>
        <input
          className="w-[80px] bg-zinc-800 rounded px-2 py-2"
          type="number"
          min={20}
          max={160}
          value={size}
          onChange={(e) => setSize(parseInt(e.target.value || '64', 10))}
        />
        <button className={`px-2 py-2 rounded ${bold ? 'bg-zinc-600' : 'bg-zinc-800'}`} onClick={() => setBold(!bold)}>B</button>
        <button className={`px-2 py-2 rounded ${italic ? 'bg-zinc-600' : 'bg-zinc-800'}`} onClick={() => setItalic(!italic)}>I</button>
        <button className={`px-2 py-2 rounded ${align === 'left' ? 'bg-zinc-600' : 'bg-zinc-800'}`} onClick={() => setAlign('left')}>L</button>
        <button className={`px-2 py-2 rounded ${align === 'center' ? 'bg-zinc-600' : 'bg-zinc-800'}`} onClick={() => setAlign('center')}>C</button>
        <button className={`px-2 py-2 rounded ${align === 'right' ? 'bg-zinc-600' : 'bg-zinc-800'}`} onClick={() => setAlign('right')}>R</button>

        <select className="bg-zinc-800 rounded px-2 py-2 ml-auto" value={slot} onChange={(e) => setSlot(Number(e.target.value) as Slot)}>
          <option value={1}>Preview 1</option>
          <option value={2}>Preview 2</option>
          <option value={3}>Preview 3</option>
          <option value={4}>Preview 4</option>
        </select>
        <button className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white" onClick={send}>
          Send to Preview
        </button>
      </div>
    </div>
  );
}
