'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { setPreviewSlot, uploadSlideImage } from '../utils/firebase';

type Slot = 1 | 2 | 3 | 4;
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
const FONT_LABEL = (f: string) => f.split(',')[0].replace(/"/g, '');
const FONT_SIZES = [24, 32, 40, 48, 56, 64, 72];

const SHAPE_SIZES = [
  { label: 'S', w: 220, h: 120 },
  { label: 'M', w: 320, h: 160 },
  { label: 'L', w: 440, h: 220 },
];

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

  // selected shape (for inspector)
  const [selectedShape, setSelectedShape] = useState<HTMLElement | null>(null);
  const deselectShape = () => setSelectedShape(null);

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
    exec('fontSize', '7'); // insert largest then normalize <font> below
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

  // ---- images -------------------------------------------------

  const onBackgroundImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // Use local data URL for fast editing. (Live HTML includes bg, so it renders correctly.)
    const reader = new FileReader();
    reader.onload = () => setBgImage(reader.result as string);
    reader.readAsDataURL(f);
  };
  const clearBackground = () => setBgImage(null);

  const onInsertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // prefer Storage upload; falls back to data URL if something goes wrong
    let url = '';
    try {
      url = await uploadSlideImage(f);
    } catch {
      url = await fileToDataUrl(f);
    }
    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.margin = '18px auto';
    img.style.display = 'block';
    const range = window.getSelection()?.getRangeAt(0);
    if (range) range.insertNode(img);
    else editorRef.current?.appendChild(img);
  };

  const fileToDataUrl = useCallback(
    (f: File) =>
      new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = rej;
        r.readAsDataURL(f);
      }),
    []
  );

  // ---- shapes -------------------------------------------------

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
    shape.style.borderRadius = kind === 'circle' ? '9999px' : '18px';
    shape.dataset.slideShape = kind;

    // selection + simple edit hooks
    shape.addEventListener('click', (ev) => {
      ev.stopPropagation();
      setSelectedShape(shape);
    });
    // double click removes
    shape.addEventListener('dblclick', () => shape.remove());

    const range = window.getSelection()?.getRangeAt(0);
    if (range) range.insertNode(shape);
    else editorRef.current?.appendChild(shape);
  };

  // allow deselect by clicking editor background
  const onEditorClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    // ignore clicks on shapes
    const el = e.target as HTMLElement;
    if (el && el.dataset.slideShape) return;
    deselectShape();
  };

  // ---- send to preview ---------------------------------------

  const htmlToSend = useMemo(() => {
    const inner = editorRef.current?.innerHTML ?? '';
    // include background so live screen matches editor
    const style = [
      `min-height:260px`,
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
    <div className="panel panel--slides h-[520px] flex flex-col">
      <div className="panel-header">Slides</div>

      {/* Top row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input input--dark w-[220px]"
          placeholder="Slide title"
        />

        <label className="btn btn-ghost cursor-pointer">
          Insert image
          <input type="file" accept="image/*" className="hidden" onChange={onInsertImage} />
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

      {/* Toolbar */}
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

        {/* Shapes tool */}
        <ShapeTool onInsert={insertShape} />

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

      {/* Shape inspector (only when a shape is selected) */}
      {selectedShape && (
        <ShapeInspector
          el={selectedShape}
          onClose={deselectShape}
          onChange={(next) => {
            if ('w' in next && next.w) selectedShape.style.width = `${next.w}px`;
            if ('h' in next && next.h) selectedShape.style.height = `${next.h}px`;
            if ('fill' in next && next.fill) selectedShape.style.background = next.fill;
            if ('z' in next && next.z !== undefined) selectedShape.style.zIndex = String(next.z);
            if ('nudge' in next && next.nudge) {
              const { dx = 0, dy = 0 } = next.nudge;
              const ml = parseInt(selectedShape.style.marginLeft || '18', 10) + dx;
              const mt = parseInt(selectedShape.style.marginTop || '18', 10) + dy;
              selectedShape.style.marginLeft = `${ml}px`;
              selectedShape.style.marginTop = `${mt}px`;
            }
          }}
          onDelete={() => {
            selectedShape.remove();
            setSelectedShape(null);
          }}
        />
      )}

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
            className="min-h-[260px] p-6 text-center text-zinc-50"
            style={{ fontFamily: font }}
            contentEditable
            suppressContentEditableWarning
            onFocus={ensureDefault}
            onClick={onEditorClick}
          />
        </div>
      </div>
    </div>
  );
}

/** Small tool to add shapes */
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

      <button className="btn btn-ghost" onClick={() => onInsert(shape, fill, size)} title="Insert shape">
        Insert
      </button>
    </div>
  );
}

/** Inspector that appears when a shape is selected. */
function ShapeInspector({
  el,
  onChange,
  onClose,
  onDelete,
}: {
  el: HTMLElement;
  onChange: (next: Partial<{ w: number; h: number; fill: string; z: number; nudge: { dx?: number; dy?: number } }>) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [w, setW] = useState(parseInt(el.style.width || '320', 10));
  const [h, setH] = useState(parseInt(el.style.height || '160', 10));
  const [fill, setFill] = useState(el.style.background || '#ffffff');
  const [z, setZ] = useState(parseInt(el.style.zIndex || '1', 10));

  return (
    <div className="mb-2 bg-zinc-900/60 border border-zinc-800 rounded-xl p-2 flex flex-wrap items-center gap-2">
      <span className="text-xs text-zinc-300">Selected shape</span>

      <label className="inline-flex items-center gap-1">
        <span className="text-xs text-zinc-400">W</span>
        <input
          type="number"
          className="input input--dark w-[90px]"
          value={w}
          onChange={(e) => setW(Number(e.target.value))}
          onBlur={() => onChange({ w })}
        />
      </label>
      <label className="inline-flex items-center gap-1">
        <span className="text-xs text-zinc-400">H</span>
        <input
          type="number"
          className="input input--dark w-[90px]"
          value={h}
          onChange={(e) => setH(Number(e.target.value))}
          onBlur={() => onChange({ h })}
        />
      </label>

      <label className="inline-flex items-center gap-2 px-2 py-1 rounded bg-zinc-800">
        <span className="text-xs text-zinc-300">Fill</span>
        <input
          type="color"
          value={fill}
          onChange={(e) => {
            setFill(e.target.value);
            onChange({ fill: e.target.value });
          }}
          className="h-6 w-8 bg-transparent"
        />
      </label>

      {/* layer order */}
      <label className="inline-flex items-center gap-1">
        <span className="text-xs text-zinc-400">Z</span>
        <input
          type="number"
          className="input input--dark w-[80px]"
          value={z}
          onChange={(e) => {
            const v = Number(e.target.value);
            setZ(v);
            onChange({ z: v });
          }}
        />
      </label>
      <button className="btn btn-ghost" onClick={() => onChange({ z: z + 1 })}>
        Bring forward
      </button>
      <button className="btn btn-ghost" onClick={() => onChange({ z: Math.max(0, z - 1) })}>
        Send backward
      </button>

      {/* nudge */}
      <div className="inline-flex items-center gap-1 ml-2">
        <button className="btn btn-ghost" title="Nudge left" onClick={() => onChange({ nudge: { dx: -5 } })}>
          ←
        </button>
        <button className="btn btn-ghost" title="Nudge right" onClick={() => onChange({ nudge: { dx: 5 } })}>
          →
        </button>
        <button className="btn btn-ghost" title="Nudge up" onClick={() => onChange({ nudge: { dy: -5 } })}>
          ↑
        </button>
        <button className="btn btn-ghost" title="Nudge down" onClick={() => onChange({ nudge: { dy: 5 } })}>
          ↓
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button className="btn btn-ghost" onClick={onDelete}>
          Delete
        </button>
        <button className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
