import React, { useRef, useState } from 'react';
import {
  setPreviewSlot,       // <- must exist in utils/firebase (writes to preview_slots/<slot>)
  uploadSlideImage,     // <- already used before for image import
} from '../utils/firebase';

type ShapeKind = 'rect' | 'circle';

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

const FONT_LABEL = (font: string) =>
  font.split(',')[0].replace(/"/g, '');

const FONT_SIZES = [24, 32, 40, 48, 56, 64, 72];

const SHAPE_SIZES = [
  { label: 'S', w: 220, h: 120 },
  { label: 'M', w: 320, h: 160 },
  { label: 'L', w: 440, h: 220 },
];

export default function SlidesMini() {
  const editorRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState('Welcome');
  const [slot, setSlot] = useState<number>(2);

  // toolbar state (so the UI reflects chosen values)
  const [font, setFont] = useState(FONTS[0]);
  const [fontSize, setFontSize] = useState<number>(48);
  const [fontColor, setFontColor] = useState('#ffffff');

  const [bgColor, setBgColor] = useState('#0b0f1a'); // deep dark default
  const [bgImage, setBgImage] = useState<string | null>(null);

  // ---------------------------
  // helpers
  // ---------------------------

  const exec = (cmd: string, value: string | null = null) => {
    // document.execCommand is deprecated but still widely supported,
    // fine for our lightweight editor.
    document.execCommand(cmd, false, value ?? undefined);
  };

  const applyFontFamily = (value: string) => {
    setFont(value);
    exec('fontName', value);
  };

  const applyFontSize = (px: number) => {
    setFontSize(px);
    // execCommand("fontSize") maps 1-7 -> UA sizes; we post-adjust with inline span.
    // Use 7 (largest) then replace <font size="7"> with span style font-size:px
    exec('fontSize', '7');

    // Normalize inserted <font> tags to <span style="font-size:...">
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const root = editorRef.current!;
    // Replace any <font size> inside editor:
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

  const insertShape = (kind: ShapeKind, fill: string, size: { w: number; h: number }) => {
    const shape = document.createElement('div');
    shape.contentEditable = 'false';
    shape.style.display = 'inline-block';
    shape.style.width = `${size.w}px`;
    shape.style.height = `${size.h}px`;
    shape.style.margin = '18px';
    shape.style.background = fill;
    shape.style.opacity = '0.95';
    shape.style.border = '2px solid rgba(255,255,255,0.85)';
    shape.style.boxShadow = '0 10px 25px rgba(0,0,0,0.35)';
    shape.style.verticalAlign = 'middle';
    shape.setAttribute('data-slide-shape', kind);

    if (kind === 'circle') {
      shape.style.borderRadius = '9999px';
    } else {
      shape.style.borderRadius = '18px';
    }

    // Allow remove on double click (simple UX)
    shape.addEventListener('dblclick', () => shape.remove());

    // Insert at caret
    const range = window.getSelection()?.getRangeAt(0);
    if (range) {
      range.insertNode(shape);
    } else {
      editorRef.current?.appendChild(shape);
    }
  };

  const onBackgroundImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // If you want to upload to Firebase Storage and use the URL as bg:
    // const url = await uploadSlideImage(f);
    // setBgImage(url);

    // For speed, use local data URL; it still saves on "Send to Preview" as HTML background.
    const reader = new FileReader();
    reader.onload = () => setBgImage(reader.result as string);
    reader.readAsDataURL(f);
  };

  const onImportSingleImageIntoEditor = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // Upload via existing util (keeps your Storage flow)
    const url = await uploadSlideImage(f);
    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.margin = '18px auto';
    img.style.display = 'block';
    const range = window.getSelection()?.getRangeAt(0);
    if (range) {
      range.insertNode(img);
    } else {
      editorRef.current?.appendChild(img);
    }
  };

  const clearBackground = () => setBgImage(null);

  const sendToPreview = async () => {
    const html = editorRef.current?.innerHTML || '';
    await setPreviewSlot(slot, {
      html,
      meta: {
        from: 'slides',
        title,
        bgColor,
        bgImage,
      },
    });
  };

  // Default editor content on first mount (if empty)
  const ensureDefault = () => {
    const root = editorRef.current!;
    if (!root.innerHTML.trim()) {
      root.innerHTML =
        '<div style="font-size:48px; line-height:1.15; font-weight:700;">Welcome to church!</div>';
    }
  };

  // ---------------------------
  // render
  // ---------------------------
  return (
    <div className="panel panel--slides">
      <div className="panel-header">Slides</div>

      {/* Top row controls */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input input--dark w-[220px]"
          placeholder="Slide title"
        />

        {/* Import an image into the editable area */}
        <label className="btn btn-ghost cursor-pointer">
          Import image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onImportSingleImageIntoEditor}
          />
        </label>

        {/* Send to preview */}
        <button className="btn btn-green" onClick={sendToPreview}>
          Send to Preview
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-zinc-400">Send to</span>
          <select
            value={slot}
            onChange={(e) => setSlot(Number(e.target.value))}
            className="select select--dark"
          >
            <option value={1}>Preview 1</option>
            <option value={2}>Preview 2</option>
            <option value={3}>Preview 3</option>
            <option value={4}>Preview 4</option>
          </select>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-2 mb-3 flex flex-wrap items-center gap-2">
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
            <option key={s} value={s}>{s}px</option>
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
        <button className="btn btn-ghost" onClick={() => exec('justifyLeft')} title="Align left">L</button>
        <button className="btn btn-ghost" onClick={() => exec('justifyCenter')} title="Align center">C</button>
        <button className="btn btn-ghost" onClick={() => exec('justifyRight')} title="Align right">R</button>

        <div className="h-6 w-px bg-zinc-700 mx-1" />

        {/* line */}
        <button className="btn btn-ghost" onClick={insertHR} title="Insert line">
          ———
        </button>

        {/* shapes */}
        <ShapeTool onInsert={insertShape} />
      </div>

      {/* Background controls */}
      <div className="flex flex-wrap items-center gap-3 mb-2">
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
          <button className="btn btn-ghost" onClick={clearBackground}>Clear background</button>
        )}
      </div>

      {/* Slide workspace */}
      <div
        className="bg-zinc-950 rounded-xl border border-zinc-800 shadow-inner overflow-auto"
        style={{
          minHeight: 280,
          maxHeight: 420,
          backgroundColor: bgColor,
          backgroundImage: bgImage ? `url(${bgImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          ref={editorRef}
          className="min-h-[260px] p-6 text-center text-zinc-50"
          contentEditable
          suppressContentEditableWarning
          style={{ fontFamily: font }}
          onFocus={ensureDefault}
        />
      </div>
    </div>
  );
}

/** A small inline tool for adding simple shapes to the editor. */
function ShapeTool({
  onInsert,
}: {
  onInsert: (kind: ShapeKind, fill: string, size: { w: number; h: number }) => void;
}) {
  const [shape, setShape] = useState<ShapeKind>('rect');
  const [fill, setFill] = useState('#ffffff');
  const [size, setSize] = useState(SHAPE_SIZES[1]); // M

  return (
    <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-zinc-900/60 border border-zinc-800">
      <span className="text-xs text-zinc-300">Shape</span>

      <select
        value={shape}
        onChange={(e) => setShape(e.target.value as ShapeKind)}
        className="select select--dark"
      >
        <option value="rect">Rectangle</option>
        <option value="circle">Circle</option>
      </select>

      <select
        value={size.label}
        onChange={(e) => {
          const next = SHAPE_SIZES.find((s) => s.label === e.target.value)!;
          setSize(next);
        }}
        className="select select--dark"
        title="Size"
      >
        {SHAPE_SIZES.map((s) => (
          <option key={s.label} value={s.label}>
            {s.label}
          </option>
        ))}
      </select>

      <input
        type="color"
        value={fill}
        onChange={(e) => setFill(e.target.value)}
        className="h-6 w-8 bg-transparent"
        title="Fill color"
      />

      <button
        className="btn btn-ghost"
        onClick={() => onInsert(shape, fill, size)}
        title="Insert shape"
      >
        Insert
      </button>
    </div>
  );
}
