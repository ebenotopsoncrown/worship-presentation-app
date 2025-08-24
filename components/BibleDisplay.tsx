'use client';
import React from 'react';
import { setPreviewSlot } from '../utils/firebase';

type Verse = { v: number; t: string };

const verMap: Record<string, string> = {
  KJV: 'kjv',
  WEB: 'web',
};

async function fetchVerses(refTxt: string, ver: string) {
  const v = verMap[ver] || ver.toLowerCase();
  const q = refTxt.trim();                       // <-- trim the input
  const res = await fetch(`/api/bible?q=${encodeURIComponent(q)}&ver=${encodeURIComponent(v)}`);  // <-- ref -> q
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Bible API error (${res.status}) ${txt}`);
  }
  return res.json();
}

function versesToSlides(ref: string, verses: Verse[], per = 2) {
  const mk = (html: string) => `<div style="font-size:2.6rem;line-height:1.2">${html}</div>`;
  const slides: string[] = [];
  for (let i = 0; i < verses.length; i += per) {
    const group = verses.slice(i, i + per);
    const head = `<div style="font-size:1rem;opacity:.7;margin-bottom:.25rem">${ref}</div>`;
    const body = group.map((v) => `<span style="opacity:.7;font-size:1rem">${v.v}</span> ${v.t}`).join('<br/>');
    slides.push(mk(head + body));
  }
  return slides;
}

export default function BibleDisplay() {
  const [refTxt, setRefTxt] = React.useState('John 3:16-18');
  const [ver, setVer] = React.useState<'KJV' | 'WEB'>('KJV');
  const [slot, setSlot] = React.useState<number>(1);
  const [loading, setLoading] = React.useState(false);
  const [previewHtml, setPreviewHtml] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');

  const preview = async () => {
    setError('');
    try {
      setLoading(true);
      const data = await fetchVerses(refTxt, ver);
      const slides = versesToSlides(data.ref, data.verses);
      setPreviewHtml(slides[0] ?? '');
    } catch (e: any) {
      setError(e?.message || 'Failed to load passage.');
      setPreviewHtml('');
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    setError('');
    try {
      setLoading(true);
      const data = await fetchVerses(refTxt, ver);
      const slides = versesToSlides(data.ref, data.verses);
      if (slot === 1) {
        await setPreviewSlot(1, {
          kind: 'slides',
          slides,
          index: 0,
          meta: { type: 'bible', ref: data.ref, ver },
        });
      } else {
        const whole = slides.join('<!-- slide -->');
        await setPreviewSlot(slot, { html: whole, meta: { type: 'bible', ref: data.ref, ver } });
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to send to preview.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel panel--bible h-[520px] flex flex-col">
      <div className="panel-header">Bible</div>

      <div className="flex items-center gap-2 mb-2">
        <input
          className="w-full bg-zinc-800 rounded px-3 py-2 outline-none"
          placeholder="John 3:16-18"
          value={refTxt}
          onChange={(e) => setRefTxt(e.target.value)}
        />
        <select
          className="bg-zinc-800 rounded px-2 py-2"
          value={ver}
          onChange={(e) => setVer(e.target.value as any)}
        >
          <option value="KJV">KJV</option>
          <option value="WEB">WEB</option>
        </select>
        <button
          onClick={preview}
          className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700"
          disabled={loading}
        >
          Preview
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <select
          className="bg-zinc-800 rounded px-2 py-2"
          value={slot}
          onChange={(e) => setSlot(parseInt(e.target.value, 10))}
        >
          <option value={1}>Preview 1</option>
          <option value={2}>Preview 2</option>
          <option value={3}>Preview 3</option>
          <option value={4}>Preview 4</option>
        </select>
        <button
          onClick={send}
          className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-zinc-700"
          disabled={loading}
        >
          Send to Preview
        </button>
      </div>

      {/* equal-height preview area */}
      <div className="flex-1 min-h-0">
        <div className="bg-black/40 rounded-xl h-full overflow-auto p-4 flex items-center justify-center">
          {previewHtml ? (
            <div
              className="w-full text-center text-zinc-50 text-3xl md:text-4xl leading-tight"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : error ? (
            <div className="text-red-400">{error}</div>
          ) : (
            <div className="text-zinc-500">Click Preview to load the passage…</div>
          )}
        </div>
      </div>
    </div>
  );
}
