import React, { useCallback, useEffect, useState } from 'react';
import {
  listenPreviewSlot,
  setLiveContent,
  setPreviewIndex,
  clearPreviewSlot,
  PreviewPayload,
} from '../utils/firebase';

// Simple fallback splitter if you ever receive plain HTML instead of slides[].
function splitHtmlToSlides(html: string): string[] {
  if (!html || !html.trim()) return [];
  if (html.includes('<!-- slide -->')) {
    return html.split(/<!--\s*slide\s*-->/gi).map((s) => s.trim()).filter(Boolean);
  }
  // default: make one slide
  return [html];
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

  const clear = useCallback(async () => {
    await clearPreviewSlot(slot); // now also clears Live if it came from this slot
    setSlides([]); setIndex(0); setArmed(false);
  }, [slot]);

  // keyboard arrows
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  return (
    <div>
      <div className="panel-header">{title}</div>

      <div className="preview-frame flex items-center justify-center">
        {total ? (
          <div className="w-full text-center leading-tight text-zinc-100 text-3xl md:text-4xl"
               dangerouslySetInnerHTML={{ __html: slides[index] }} />
        ) : (
          <div className="text-zinc-400">Empty</div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 gap-2">
        <div className="flex gap-2">
          <button onClick={clear} className="btn btn-ghost">Clear</button>
          <button onClick={goLive} disabled={!total} className="btn btn-green">Go Live</button>
        </div>
        <div className="flex gap-2">
          <button onClick={prev} disabled={!total || index === 0} className="btn btn-ghost">◀ Prev</button>
          <button onClick={next} disabled={!total || index === total - 1} className="btn btn-ghost">Next ▶</button>
        </div>
      </div>
    </div>
  );
}
