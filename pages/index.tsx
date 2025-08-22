import React from 'react';
import PreviewQueue from '../components/PreviewQueue';
import HymnDisplay from '../components/HymnDisplay';
import BibleDisplay from '../components/BibleDisplay';
import SlidesMini from '../components/SlidesMini';
import { listenPreviewSlot, setLiveContent, clearPreviewSlot, PreviewPayload } from '../utils/firebase';

function SimplePreviewCard({ slot, title }: { slot: number; title: string }) {
  const [payload, setPayload] = React.useState<PreviewPayload>(null);

  React.useEffect(() => {
    const off = listenPreviewSlot(slot, (v) => setPayload(v));
    return () => off();
  }, [slot]);

  const html =
    (payload && (payload as any).slides && (payload as any).slides[(payload as any).index ?? 0]) ||
    (payload && (payload as any).html) ||
    '';

  return (
    <div className="bg-zinc-900 rounded-2xl p-4 shadow-inner border border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <div className="text-zinc-200 font-semibold">{title}</div>
      </div>

      <div className="bg-black/40 rounded-xl min-h-[180px] h-[220px] overflow-auto flex items-center justify-center p-4">
        {html ? (
          <div
            className="w-full text-center leading-tight text-zinc-100"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="text-zinc-500">Empty</div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 gap-2">
        <button
          onClick={() => clearPreviewSlot(slot)}
          className="px-3 py-1.5 text-sm rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
        >
          Clear
        </button>
        <button
          onClick={() => html && setLiveContent({ html, meta: { fromPreview: slot } })}
          className="px-3 py-1.5 text-sm rounded bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white"
          disabled={!html}
        >
          Go Live
        </button>
      </div>
    </div>
  );
}

function LiveScreen() {
  const [html, setHtml] = React.useState<string>('');
  React.useEffect(() => {
    const off = listenPreviewSlot(0, () => {}); // no-op, keeps types quiet
    return () => off();
  }, []);
  React.useEffect(() => {
    // simple listener for live_content
    const { listenLiveContent } = require('../utils/firebase');
    const off = listenLiveContent((v) => setHtml(v?.html || ''));
    return () => off();
  }, []);
  return (
    <div className="bg-zinc-900 rounded-2xl p-4 shadow-inner border border-zinc-800 h-full">
      <div className="text-zinc-200 font-semibold mb-2">Live</div>
      <div className="bg-black/60 rounded-xl h-[220px] overflow-auto p-4 flex items-center justify-center">
        {html ? (
          <div
            className="w-full text-center text-zinc-50 text-3xl md:text-4xl leading-tight"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="text-zinc-500">Nothing live</div>
        )}
      </div>
    </div>
  );
}

export default function IndexPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6 space-y-6">
      {/* PREVIEW AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preview 1 -> queued controller */}
            <PreviewQueue slot={1} title="Preview 1 (Queued)" />
            {/* Preview 2 */}
            <SimplePreviewCard slot={2} title="Preview 2" />
            {/* Preview 3 */}
            <SimplePreviewCard slot={3} title="Preview 3" />
            {/* Preview 4 */}
            <SimplePreviewCard slot={4} title="Preview 4" />
          </div>
        </div>
        <div className="lg:col-span-1">
          <LiveScreen />
        </div>
      </div>

      {/* CONTENT PANELS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <HymnDisplay />
        </div>
        <div className="xl:col-span-1">
          <BibleDisplay />
        </div>
        <div className="xl:col-span-1">
          <SlidesMini />
        </div>
      </div>
    </div>
  );
}
