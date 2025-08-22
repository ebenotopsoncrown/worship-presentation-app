// components/PreviewQueue.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  listenPreviewSlot, setLiveContent, setPreviewIndex,
  clearPreviewSlot, PreviewPayload,
} from '../utils/firebase';

// fallbacks when HTML comes as one big block
function splitHtmlToSlides(html: string): string[] {
  if (!html || !html.trim()) return [];
  if (html.includes('<!-- slide -->')) {
    return html.split(/<!--\s*slide\s*-->/gi).map(s => s.trim()).filter(Boolean);
  }
  if (/(data-slide|class=["']slide["'])/i.test(html)) {
    return html.split(/<hr[^>]*(data-slide|class=["']slide["'][^>]*)[^>]*>/gi)
      .map(s => s.trim()).filter(Boolean);
  }
  // generic: break by blank paragraph / <br> groups
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '');
  const chunks = text.split(/\n{2,}/).map(c => c.trim()).filter(Boolean);
  const slides: string[] = [];
  for (const ch of chunks) {
    const lines = ch.split(/\n+/).map(l => l.trim()).filter(Boolean);
    if (lines.length <= 6) slides.push(lines.join('<br/>'));
    else for (let i = 0; i < lines.length; i += 6) slides.push(lines.slice(i, i + 6).join('<br/>'));
  }
  return slides.map(s => `<div>${s}</div>`);
}

export default function PreviewQueue({ slot = 1, title = 'Preview 1 (Queued)' }: { slot?: number; title?: string; }) {
  const [slides, setSlides] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [armed, setArmed] = useState(false);
  const total = slides.length;

  useEffect(() => {
    const off = listenPreviewSlot(slot, (payload: PreviewPayload) => {
      if (!payload) { setSlides([]); setIndex(0); setArmed(false); return; }
      if ((payload as any).slides) {
        const p = payload as any;
        setSlides(Array.isArray(p.slides) ? p.slides : []);
        setIndex(typeof p.index === 'number' ? p.index : 0);
        setArmed(false);
      } else if ((payload as any).html) {
        const arr = splitHtmlToSlides((payload as any).html);
        setSlides(arr.length ? arr : [(payload as any).html]);
        setIndex(0);
        setArmed(false);
      }
    });
    return () => off();
  }, [slot]);

  const pushLive = useCallback(async (i: number) => {
    if (!slides.length) return;
    await setLiveContent({ html: slides[i], meta: { fromPreview: slot, index: i, total: slides.length } });
  }, [slides, slot]);

  const goLive = useCallback(async () => {
    if (!slides.length) return;
    setArmed(true);
    await pushLive(index);
    await setPreviewIndex(slot, index);
  }, [index, slides.length, pushLive, slot]);

  const next = useCallback(async () => {
    if (!total) return;
    const ni = Math.min(index + 1, total - 1);
    setIndex(ni);
    await setPreviewIndex(slot, ni);
    if (armed) await pushLive(ni);
  }, [armed, index, total, pushLive, slot]);

  const prev = useCallback(async () => {
    if (!total) return;
    const pi = Math.max(index - 1, 0);
    setIndex(pi);
    await setPreviewIndex(slot, pi);
    if (armed) await pushLive(pi);
  }, [armed, index, total, pushLive, slot]);

  const clear = useCallback(async () => { await clearPreviewSlot(slot); setSlides([]); setIndex(0); setArmed(false); }, [slot]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  return (
    <div className="bg-zinc-900 rounded-2xl p-4 shadow-inner border border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <div className="text-zinc-200 font-semibold">{title}</div>
        <div className="text-xs text-zinc-400">{total ? `Slide ${index + 1} / ${total}` : 'Empty'}</div>
      </div>

      <div className="bg-black/40 rounded-xl min-h-[180px] h-[220px] overflow-auto flex items-center justify-center p-4">
        {total ? (
          <div className="w-full text-center leading-tight text-zinc-100 text-3xl md:text-4xl"
               dangerouslySetInnerHTML={{ __html: slides[index] }} />
        ) : <div className="text-zinc-500">Empty</div>}
      </div>

      <div className="flex items-center justify-between mt-3 gap-2">
        <div className="flex gap-2">
          <button onClick={clear}
                  className="px-3 py-1.5 text-sm rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200">Clear</button>
          <button onClick={goLive} disabled={!total}
                  className="px-3 py-1.5 text-sm rounded bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white">
            Go Live
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={prev} disabled={!total || index === 0}
                  className="px-3 py-1.5 text-sm rounded bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-700 text-zinc-200">◀ Prev</button>
          <button onClick={next} disabled={!total || index === total - 1}
                  className="px-3 py-1.5 text-sm rounded bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-700 text-zinc-200">Next ▶</button>
        </div>
      </div>

      <div className="mt-2 text-xs text-zinc-400">
        Tip: use <kbd>←</kbd>/<kbd>→</kbd> to step. After <span className="px-1 rounded bg-emerald-700 text-white">Go Live</span>,
        Next/Prev also update the Live screen.
      </div>
    </div>
  );
}
