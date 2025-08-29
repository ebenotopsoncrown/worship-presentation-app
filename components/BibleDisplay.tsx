// components/BibleDisplay.tsx
'use client';

import React from 'react';
import { setPreviewSlot, type Slot } from '../utils/firebase';

type Verse = { v: number; t: string };
type ApiOk = { ref: string; verses: Verse[] };
type ApiErr = { error?: string };

const toHtml = (ref: string, verses: Verse[]) => {
  const body = verses
    .map((v) => `<span class="opacity-60 mr-2">${v.v}</span>${v.t}`)
    .join('<br/>');
  return `
    <div style="font-size:.95rem;opacity:.8;margin-bottom:.25rem">${ref}</div>
    <div style="font-size:2.2rem;line-height:1.25">${body}</div>`;
};

export default function BibleDisplay() {
  const [refText, setRefText] = React.useState('John 3:16-18');
  const [ver, setVer] = React.useState('KJV');
  const [slot, setSlot] = React.useState<Slot>(2);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = React.useState<string>('');

  const preview = async () => {
    setError(null);
    setPreviewHtml('');
    const q = refText.trim();
    if (!q) {
      setError('Please enter a Bible reference.');
      return;
    }
    setBusy(true);
    try {
      // NOTE: confirm the param name your API expects: `ver` vs `ve`
      const r = await fetch(`/api/bible?q=${encodeURIComponent(q)}&ver=${encodeURIComponent(ver)}`);
      const data = (await r.json()) as ApiOk & ApiErr;
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

      const verses = Array.isArray(data?.verses) ? data.verses : [];
      setPreviewHtml(toHtml(data.ref || q, verses));
    } catch (e: any) {
      setError(e?.message || 'Failed to load verses');
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    if (!previewHtml) return;
    await setPreviewSlot(slot, { type: 'html', content: previewHtml });
  };

  return (
    <div className="flex items-center gap-2">
      <input
        value={refText}
        onChange={(e) => setRefText(e.target.value)}
        className="w-full bg-zinc-800 rounded px-3 py-2 outline-none"
        placeholder="e.g., John 3:16-18"
      />

      <select
        className="bg-zinc-800 rounded px-2 py-2"
        value={ver}
        onChange={(e) => setVer(e.target.value)}
      >
        <option>KJV</option>
        <option>NIV</option>
        <option>ESV</option>
        <option>NKJV</option>
      </select>

      <button
        onClick={preview}
        disabled={busy}
        className="px-3 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white disabled:opacity-50"
      >
        Preview
      </button>

      <select
        className="bg-zinc-800 rounded px-2 py-2"
        value={slot}
        onChange={(e) => setSlot(Number(e.target.value) as Slot)}
      >
        <option value={1}>Preview 1</option>
        <option value={2}>Preview 2</option>
        <option value={3}>Preview 3</option>
        <option value={4}>Preview 4</option>
      </select>

      <button
        onClick={send}
        disabled={!previewHtml || busy}
        className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-zinc-700"
      >
        Send to Preview
      </button>
    </div>
  );
}
