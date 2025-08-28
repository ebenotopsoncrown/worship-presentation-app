// pages/index.tsx
'use client';

import AppHeader from '../components/AppHeader';
import HymnDisplay from '../components/HymnDisplay';
import BibleDisplay from '../components/BibleDisplay';
import SlidesMini from '../components/SlidesMini';
import React from 'react';
import { copyPreviewToLive, listenPreviewSlot, clearPreviewSlot, Slot } from '../utils/firebase';

function Panel({
  title,
  slot,
}: {
  title: string;
  slot: Slot;
}) {
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    const off = listenPreviewSlot(slot, setData);
    return () => off();
  }, [slot]);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#141418]">
      <div className="rounded-t-2xl p-3 text-sm font-semibold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
        {title}
      </div>

      <div className="p-4 min-h-[300px] flex items-center justify-center">
        {!data ? (
          <div className="text-zinc-400">Empty</div>
        ) : data.type === 'image' ? (
          <img src={data.content} alt="" className="max-w-full max-h-[300px] object-contain" />
        ) : data.type === 'html' ? (
          <div
            className="w-full max-w-3xl text-xl leading-relaxed"
            dangerouslySetInnerHTML={{ __html: data.content }}
          />
        ) : (
          <div className="w-full max-w-3xl text-2xl">{data.content}</div>
        )}
      </div>

      <div className="p-3 flex gap-2">
        <button
          className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-sm"
          onClick={() => clearPreviewSlot(slot)}
        >
          Clear
        </button>
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
   <AppHeader />
    <div className="min-h-screen bg-[#0b0b0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600">
        <div className="mx-auto max-w-7xl px-4 py-3 text-lg font-bold">
          Worship Presentation App — MFM Goshen Assembly
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Panel title="Preview 1 (Queued)" slot={1} />
        <Panel title="Preview 2" slot={2} />
        {/* Live is a separate route; this column can be left for tools or omit */}
        <div className="rounded-2xl border border-white/10 bg-[#141418]">
          <div className="rounded-t-2xl p-3 text-sm font-semibold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
            Live (open /live to present)
          </div>
          <div className="p-4 text-zinc-400">Open a new tab: <code>/live</code></div>
        </div>

        <Panel title="Preview 3" slot={3} />
        <Panel title="Preview 4" slot={4} />
      </main>
    </div>
  );
}
