// pages/index.tsx
'use client';

import React from 'react';
import AppHeader from '../components/AppHeader';
import HymnDisplay from '../components/HymnDisplay';
import BibleDisplay from '../components/BibleDisplay';
import SlidesMini from '../components/SlidesMini';
import {
  Slot,
  listenPreviewSlot,
  clearPreviewSlot,
  copyPreviewToLive,
} from '../utils/firebase';

type CardProps = {
  title: string;
  slot: Slot;
};

function PreviewCard({ title, slot }: CardProps) {
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    const off = listenPreviewSlot(slot, setData);
    return () => off();
  }, [slot]);

  let body: React.ReactNode = <div className="text-zinc-400">Empty</div>;
  if (data) {
    if (data.kind === 'slides') {
      const html = (data.slides?.[data.index!] as string) || '';
      body = <div dangerouslySetInnerHTML={{ __html: html }} />;
    } else if (data.type === 'html') {
      body = <div dangerouslySetInnerHTML={{ __html: data.content || '' }} />;
    } else if (data.type === 'text') {
      body = <div className="text-2xl">{data.content}</div>;
    } else if (data.type === 'image') {
      body = <img src={data.content} alt="" className="max-w-full max-h-[300px] object-contain" />;
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#141418]">
      <div className="rounded-t-2xl p-3 text-sm font-semibold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
        {title}
      </div>

      <div className="p-4 min-h-[300px] flex items-center justify-center">{body}</div>

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
          disabled={!data}
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
      <AppHeader />

      <main className="mx-auto w-full max-w-[1500px] p-4">
        {/* Top: Previews (2x2) + Live on the right */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.15fr] gap-4">
          {/* left column */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PreviewCard title="Preview 1 (Queued)" slot={1} />
            <PreviewCard title="Preview 2" slot={2} />
            <PreviewCard title="Preview 3" slot={3} />
            <PreviewCard title="Preview 4" slot={4} />
          </div>

          {/* right column – live iframe */}
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

        {/* Editor row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="panel-header mb-3">Hymns</div>
            <HymnDisplay />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="panel-header mb-3">Bible</div>
            <BibleDisplay />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="panel-header mb-3">Slides</div>
            <SlidesMini />
          </div>
        </div>
      </main>
    </div>
  );
}
