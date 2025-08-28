// pages/index.tsx
'use client';

import React from 'react';
import AppHeader from '../components/AppHeader';
import HymnDisplay from '../components/HymnDisplay';
import BibleDisplay from '../components/BibleDisplay';
import SlidesMini from '../components/SlidesMini';
import {
  listenPreviewSlot,
  clearPreviewSlot,
  copyPreviewToLive,
  Slot,
} from '../utils/firebase';

/** Renders whatever is stored in a preview slot. */
function SlotContent({ data }: { data: any }) {
  // Support both simple payloads {type, content} and slide payloads {kind:'slides', slides[], index}
  if (!data) return <div className="text-zinc-400">Empty</div>;

  // Slides (e.g., hymn verse pages)
  if (data.kind === 'slides' && Array.isArray(data.slides)) {
    const idx = typeof data.index === 'number' ? data.index : 0;
    const html = data.slides[idx] || '';
    return (
      <div
        className="w-full max-w-3xl text-xl leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // Standard payloads
  switch (data.type) {
    case 'image':
      return (
        <img
          src={data.content}
          alt=""
          className="max-w-full max-h-[360px] object-contain"
        />
      );
    case 'html':
      return (
        <div
          className="w-full max-w-3xl text-xl leading-relaxed"
          dangerouslySetInnerHTML={{ __html: data.content }}
        />
      );
    default:
      return <div className="w-full max-w-3xl text-2xl">{data.content}</div>;
  }
}

function PreviewPanel({ title, slot }: { title: string; slot: Slot }) {
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    const off = listenPreviewSlot(slot, setData);
    return () => off();
  }, [slot]);

  // lightweight helpers for queue buttons (no compile-time dependency)
  const queue = async (dir: 'prev' | 'next') => {
    try {
      await fetch(`/api/queue?slot=${slot}&dir=${dir}`, { method: 'POST' });
    } catch {
      // Silently ignore if the endpoint isn't present
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#141418]">
      <div className="rounded-t-2xl p-3 text-sm font-semibold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
        {title}
      </div>

      <div className="p-4 min-h-[360px] flex items-center justify-center">
        <SlotContent data={data} />
      </div>

      <div className="p-3 flex items-center gap-2">
        <button
          className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-sm"
          onClick={() => clearPreviewSlot(slot)}
        >
          Clear
        </button>

        {/* Queue controls for Preview 1 only */}
        {slot === 1 && (
          <>
            <div className="flex-1" />
            <div className="flex gap-2">
              <button
                className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-sm"
                onClick={() => queue('prev')}
                aria-label="Previous item in queue"
              >
                ◀ Prev
              </button>
              <button
                className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-sm"
                onClick={() => queue('next')}
                aria-label="Next item in queue"
              >
                Next ▶
              </button>
            </div>
          </>
        )}

        <div className="flex-1" />
        <button
          className="px-3 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-sm"
          onClick={() => copyPreviewToLive(slot)}
        >
          Go Live
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white">
      {/* Keep your original header (with Login/Logout etc.) */}
      <AppHeader />

      <main className="mx-auto w-full max-w-[1500px] p-4">
        {/* Top: Previews (2x2) + wide Live on the right */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.15fr] gap-4">
          {/* 4 previews, consistent size and headers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PreviewPanel title="Preview 1 (Queued)" slot={1} />
            <PreviewPanel title="Preview 2" slot={2} />
            <PreviewPanel title="Preview 3" slot={3} />
            <PreviewPanel title="Preview 4" slot={4} />
          </div>

          {/* Live column — iframe shows the /live route, uses full height */}
          <div className="rounded-2xl border border-white/10 bg-[#141418] overflow-hidden">
            <div className="rounded-t-2xl p-3 text-sm font-semibold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
              Live
            </div>
            <div className="p-0">
              <iframe
                src="/live"
                title="Live"
                className="w-full"
                style={{ height: 'calc(100vh - 180px)' }}
              />
            </div>
          </div>
        </div>

        {/* Bottom: tools row — equal heights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          <div className="rounded-2xl border border-white/10 bg-[#141418] p-3 flex flex-col">
            <HymnDisplay />
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#141418] p-3 flex flex-col">
            <BibleDisplay />
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#141418] p-3 flex flex-col">
            <SlidesMini />
          </div>
        </div>
      </main>
    </div>
  );
}
