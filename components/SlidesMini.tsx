'use client';

import React from 'react';
import { setPreviewSlot, type Slot } from '../utils/firebase';

type Align = 'left' | 'center' | 'right';

export default function SlidesMini() {
  const [slot, setSlot] = React.useState<Slot>(2);
  const [imgDataUrl, setImgDataUrl] = React.useState<string | null>(null);

  // basic text editor controls (kept minimal as requested)
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

    // Images supported directly. For PPT/PPTX you’ll need a separate server step.
    const isImage = /^image\//.test(f.type);
    if (!isImage) {
      alert('Only images are supported here (PNG/JPG/WebP). For PowerPoint, export slides as images first.');
      e.currentTarget.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImgDataUrl(String(reader.result || ''));
    };
    reader.readAsDataURL(f);
  };

  const buildTextHtml = () => {
    const fw = bold ? 700 : 400;
    const fs = italic ? 'italic' : 'normal';
    const ta =
      align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';

    // container is full-size so it can overlay on image if present
    return `
<div style="
  width:100%;
  height:100%;
  display:flex;
  align-items:center;
  justify-content:${align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'};
  text-align:${ta};
">
  <div style="
    font-family:${font}, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
    font-weight:${fw};
    font-style:${fs};
    font-size:${size}px;
    color:${color};
    line-height:1.1;
    padding:1rem;
    width:100%;
  ">
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
    <div className="panel panel--slides h-[520px] flex flex-col">
      <div className="panel-header">Slides</div>

      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <input
          className="w-full bg-zinc-800 rounded px-3 py-2 outline-none"
          placeholder="Type text to overlay (or leave empty if you only want an image)…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          onClick={onPickFile}
          className="px-3 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white"
        >
          Insert image/slide
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={onFileChange}
        />

        <select
          className="bg-zinc-800 rounded px-2 py-2"
          value={font}
          onChange={(e) => setFont(e.target.value)}
          title="Font"
        >
          <option value="Inter">Inter</option>
          <option value="Segoe UI">Segoe UI</option>
          <option value="Roboto">Roboto</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Arial">Arial</option>
        </select>

        <select
          className="bg-zinc-800 rounded px-2 py-2"
          value={size}
          onChange={(e) => setSize(parseInt(e.target.value, 10))}
          title="Size"
        >
          {[32, 40, 48, 56, 64, 72, 96, 128].map((n) => (
            <option key={n} value={n}>
              {n}px
            </option>
          ))}
        </select>

        <button
          onClick={() => setBold((v) => !v)}
          className={`px-2 py-2 rounded ${
            bold ? 'bg-zinc-600' : 'bg-zinc-800'
          }`}
          title="Bold"
        >
          B
        </button>
        <button
          onClick={() => setItalic((v) => !v)}
          className={`px-2 py-2 rounded ${
            italic ? 'bg-zinc-600' : 'bg-zinc-800'
          }`}
          title="Italic"
        >
          I
        </button>

        <button
          onClick={() => setAlign('left')}
          className={`px-2 py-2 rounded ${
            align === 'left' ? 'bg-zinc-600' : 'bg-zinc-800'
          }`}
          title="Align left"
        >
          L
        </button>
        <button
          onClick={() => setAlign('center')}
          className={`px-2 py-2 rounded ${
            align === 'center' ? 'bg-zinc-600' : 'bg-zinc-800'
          }`}
          title="Align center"
        >
          C
        </button>
        <button
          onClick={() => setAlign('right')}
          className={`px-2 py-2 rounded ${
            align === 'right' ? 'bg-zinc-600' : 'bg-zinc-800'
          }`}
          title="Align right"
        >
          R
        </button>

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="bg-zinc-800 rounded px-2 py-2"
          title="Text color"
        />

        <select
          className="bg-zinc-800 rounded px-2 py-2 ml-auto"
          value={slot}
          onChange={(e) => setSlot(parseInt(e.target.value, 10) as Slot)}
          title="Send to"
        >
          <option value={1}>Preview 1</option>
          <option value={2}>Preview 2</option>
          <option value={3}>Preview 3</option>
          <option value={4}>Preview 4</option>
        </select>

        <button
          onClick={send}
          className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          Send to Preview
        </button>
      </div>

      {/* preview area (equal height) */}
      <div className="bg-black/40 rounded-xl flex-1 min-h-0 overflow-hidden relative">
        {/* image */}
        {imgDataUrl && (
          <img
            src={imgDataUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-contain"
          />
        )}

        {/* text overlay */}
        {text.trim() && (
          <div
            className="absolute inset-0"
            dangerouslySetInnerHTML={{ __html: buildTextHtml() }}
          />
        )}

        {!imgDataUrl && !text.trim() && (
          <div className="w-full h-full flex items-center justify-center text-zinc-500">
            No content yet — pick an image or type text above.
          </div>
        )}
      </div>
    </div>
  );
}

/** Utils */
function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
