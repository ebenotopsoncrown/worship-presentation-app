'use client';

import React, { useMemo, useRef, useState } from 'react';
import { setPreviewSlot, uploadSlideImage } from '../utils/firebase';

type Slot = 1 | 2 | 3 | 4;

const FONTS = [
  'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  'Arial, Helvetica, sans-serif',
  'Helvetica, Arial, sans-serif',
  '"Times New Roman", Times, serif',
  'Georgia, serif',
  'Garamond, serif',
  '"Trebuchet MS", sans-serif',
  'Verdana, Geneva, sans-serif',
  'Tahoma, Geneva, sans-serif',
  '"Courier New", Courier, monospace',
];
const FONT_LABEL = (f: string) => f.split(',')[0].replace(/"/g, '');
const FONT_SIZES = [24, 32, 40, 48, 56, 64, 72];

export default function SlidesMini() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  // slide meta
  const [title, setTitle] = useState('Welcome');
  const [slot, setSlot] = useState<Slot>(2);

  // text toolbar
  const [font, setFont] = useState(FONTS[0]);
  const [fontSize, setFontSize] = useState<number>(48);
  const [fontColor, setFontColor] = useState('#ffffff');

  // background
  const [bgColor, setBgColor] = useState('#0b0f1a');
  const [bgImage, setBgImage] = useState<string | null>(null);

  // ------------------------------------------------------------
  // helpers
  // ------------------------------------------------------------
  const exec = (cmd: string, value: string | null = null) =>
    document.execCommand(cmd, false, value ?? undefined);

  const applyFontFamily = (value: string) => {
    setFont(value);
    exec('fontName', value);
  };

  const applyFontSize = (px: number) => {
    setFontSize(px);
    // use browser largest, then normalize <font> to inline span with px
    exec('fontSize', '7');
    const root = editorRef.current!;
    root.querySelectorAll('font[size]').forEach((f) => {
      const span = document.createElement('span');
      span.style.fontSize = `${px}px`;
      span.innerHTML = (f as HTMLElement).innerHTML;
      f.replaceWith(span);
    });
  };

  const applyColor = (color: string) => {
    setFontColor(color);
    exec('foreColor', color);
  };

  const insertHR = () => exec('insertHorizontalRule');

  const ensureDefault = () => {
    const root = editorRef.current!;
    if (!root.innerHTML.trim()) {
      root.innerHTML =
        '<div style="font-size:48px; line-height:1.15; font-weight:700;">Welcome to church!</div>';
    }
  };

  // ---- images / slides ---------------------------------------

  // --- replace addImgElement, handleFiles, onInsertImage with this ---

const addImgElement = (src: string) => {
  // focus first so selection is inside the editor
  editorRef.current?.focus();

  const img = document.createElement('img');
  img.src = src;
  img.style.maxWidth = '100%';
  img.style.maxHeight = '100%';
  img.style.height = 'auto';
  img.style.objectFit = 'contain';
  img.style.margin = '18px auto';
  img.style.display = 'block';

  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    range.insertNode(img);
    // move caret after the image
    range.setStartAfter(img);
    range.setEndAfter(img);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    editorRef.current?.appendChild(img);
  }
  return img;
};

const handleFiles = async (files: FileList) => {
  const imageFiles: File[] = [];
  const unsupported: File[] = [];

  Array.from(files).forEach((f) => {
    const lower = f.name.toLowerCase();
    if (/\.(png|jpe?g|gif|webp|svg)$/.test(lower)) imageFiles.push(f);
    else if (/\.(pptx?|pdf)$/.test(lower)) unsupported.push(f);
  });

  if (unsupported.length) {
    alert(
      'PPT/PPTX/PDF import is not supported directly in the browser.\n' +
      'Please export slides as images (PNG/JPG) and upload those.\n\n' +
      `Ignored: ${unsupported.map((f) => f.name).join(', ')}`
    );
  }

  for (const f of imageFiles) {
    // 1) Show immediately (data URL preview)
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

    const imgEl = addImgElement(dataUrl);

    // 2) Try to upload in the background and upgrade to CDN URL
    try {
      // optional: only call if function exists
      if (typeof uploadSlideImage === 'function') {
        const cdnUrl = await uploadSlideImage(f);
        if (cdnUrl) imgEl.src = cdnUrl;
      }
    } catch (err) {
      // keep the data URL if upload fails
      console.error('SLIDES: upload failed, keeping local preview', err);
    }
  }
};

const onInsertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
  try {
    if (e.target.files?.length) await handleFiles(e.target.files);
  } finally {
    // allow selecting the same file again
    e.target.value = '';
  }
};

  const onBackgroundImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setBgImage(reader.result as string);
    reader.readAsDataURL(f);
  };
  const clearBackground = () => setBgImage(null);

  // ---- send to preview ---------------------------------------
  const htmlToSend = useMemo(() => {
    const inner = editorRef.current?.innerHTML ?? '';
    const style = [
      `min-height:320px`,
      `height:100%`,
      `padding:24px`,
      `color:#e5e7eb`,
      `text-align:center`,
      `background:${bgColor}`,
      bgImage ? `background-image:url(${bgImage})` : '',
      `background-size:cover`,
      `background-position:center`,
      `border-radius:12px`,
    ]
      .filter(Boolean)
      .join(';');

    // The inner content already contains <img> with object-fit: contain sizing
    return `<div style="${style}; font-family:${font}">${inner}</div>`;
  }, [bgColor, bgImage, font]);

  const sendToPreview = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await setPreviewSlot(slot, {
        id: `slides-${Date.now()}`,
        kind: 'slides',
        title: title ?? '',
        html: htmlToSend,
      });
    } finally {
      setBusy(false);
    }
  };

  // ------------------------------------------------------------
  // render
  // ------------------------------------------------------------
  return (
    <div className="panel panel--slides h-[640px] flex flex-col">
      <div className="panel-header">Slides</div>

      {/* Top row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input input--dark w-[260px]"
          placeholder="Slide title"
        />

        <label className="btn btn-ghost cursor-pointer">
          Insert image/slide
          <input
            type="file"
            className="hidden"
            multiple
            // accept images; we also let the user pick ppt/pptx/pdf to show the friendly notice
            accept="image/*,.ppt,.pptx,.pdf"
            onChange={onInsertImage}
          />
        </label>

        <button className="btn btn-green" onClick={sendToPreview} disabled={busy}>
          {busy ? 'Sending…' : 'Send to Preview'}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-zinc-400">Send to</span>
          <select
            value={slot}
            onChange={(e) => setSlot(Number(e.target.value) as Slot)}
            className="select select--dark"
          >
            <option value={1}>Preview 1</option>
            <option value={2}>Preview 2</option>
            <option value={3}>Preview 3</option>
            <option value={4}>Preview 4</option>
          </select>
        </div>
      </div>

      {/* Toolbar (basic text + background) */}
      <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-2 mb-2 flex flex-wrap items-center gap-2">
        {/* font family */}
        <select
          value={font}
          onChange={(e) => applyFontFamily(e.target.value)}
          className="select select--dark"
          title="Font family"
        >
          {FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {FONT_LABEL(f)}
            </option>
          ))}
        </select>

        {/* font size */}
        <select
          value={fontSize}
          onChange={(e) => applyFontSize(Number(e.target.value))}
          className="select select--dark"
          title="Font size"
        >
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}px
            </option>
          ))}
        </select>

        {/* color */}
        <label className="inline-flex items-center gap-2 px-2 py-1 rounded bg-zinc-800">
          <span className="text-xs text-zinc-300">Text</span>
          <input
            type="color"
            value={fontColor}
            onChange={(e) => applyColor(e.target.value)}
            className="h-6 w-8 bg-transparent"
          />
        </label>

        <div className="h-6 w-px bg-zinc-700 mx-1" />

        {/* B / I / U */}
        <button className="btn btn-ghost" onClick={() => exec('bold')} title="Bold">
          <span className="font-bold">B</span>
        </button>
        <button className="btn btn-ghost" onClick={() => exec('italic')} title="Italic">
          <span className="italic">I</span>
        </button>
        <button className="btn btn-ghost" onClick={() => exec('underline')} title="Underline">
          <span className="underline">U</span>
        </button>

        <div className="h-6 w-px bg-zinc-700 mx-1" />

        {/* Align */}
        <button className="btn btn-ghost" onClick={() => exec('justifyLeft')} title="Align left">
          L
        </button>
        <button className="btn btn-ghost" onClick={() => exec('justifyCenter')} title="Align center">
          C
        </button>
        <button className="btn btn-ghost" onClick={() => exec('justifyRight')} title="Align right">
          R
        </button>

        <div className="h-6 w-px bg-zinc-700 mx-1" />

        {/* HR */}
        <button className="btn btn-ghost" onClick={insertHR} title="Insert line">
          ———
        </button>

        {/* Background controls */}
        <div className="h-6 w-px bg-zinc-700 mx-1" />
        <label className="inline-flex items-center gap-2 px-2 py-1 rounded bg-zinc-900/60 border border-zinc-800">
          <span className="text-xs text-zinc-300">Background</span>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="h-6 w-8 bg-transparent"
          />
        </label>
        <label className="btn btn-ghost cursor-pointer">
          Background image
          <input type="file" accept="image/*" className="hidden" onChange={onBackgroundImage} />
        </label>
        {bgImage && (
          <button className="btn btn-ghost" onClick={clearBackground}>
            Clear background
          </button>
        )}
      </div>

      {/* Workspace (fills remaining height) */}
      <div className="flex-1 min-h-0">
        <div
          className="bg-zinc-950 rounded-xl border border-zinc-800 shadow-inner overflow-auto h-full"
          style={{
            backgroundColor: bgColor,
            backgroundImage: bgImage ? `url(${bgImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div
            ref={editorRef}
            className="min-h-[320px] h-full p-6 text-center text-zinc-50"
            style={{ fontFamily: font }}
            contentEditable
            suppressContentEditableWarning
            onFocus={ensureDefault}
          />
        </div>
      </div>
    </div>
  );
}

