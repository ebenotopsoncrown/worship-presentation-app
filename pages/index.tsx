import React from 'react';
import PreviewQueue from '../components/PreviewQueue';
import HymnDisplay from '../components/HymnDisplay';
import BibleDisplay from '../components/BibleDisplay';
import SlidesMini from '../components/SlidesMini';
import {
  listenPreviewSlot,
  setLiveContent,
  clearPreviewSlot,
  type PreviewPayload,
} from '../utils/firebase';

/** Thin card wrapper so Preview 1 (queued) gets the same rounded box look */
function PreviewQueueCard({ slot, title }: { slot: number; title: string }) {
  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-inner p-3">
      {/* PreviewQueue already renders its own header; we just provide the same frame around it */}
      <PreviewQueue slot={slot} title={title} />
    </div>
  );
}

/** Consistent preview card used for slots 2–4 */
function SimplePreviewCard({ slot, title }: { slot: number; title: string }) {
  const [payload, setPayload] = React.useState<PreviewPayload>(null);

  React.useEffect(() => {
    const off = listenPreviewSlot(slot, (v) => setPayload(v));
    return () => off();
  }, [slot]);

  // Prefer slide image/text at current index; otherwise html; otherwise empty
  const html =
    (payload && (payload as any).slides && (payload as any).slides[(payload as any).index ?? 0]) ||
    (payload && (payload as any).html) ||
    '';

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-inner p-3">
      {/* Gradient header bar to match Preview 1’s look */}
      <div className="rounded-md px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 mb-3">
        {title}
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

/** Shows the current live output */
function LiveScreen() {
  const [html, setHtml] = React.useState<string>('');

  React.useEffect(() => {
    const { listenLiveContent } = require('../utils/firebase');
    const off = listenLiveContent((v: any) => setHtml(v?.html || ''));
    return () => off();
  }, []);

  return (
    // Make the card a flex column so the display box can expand
    <div className="bg-zinc-900 rounded-2xl p-4 shadow-inner border border-zinc-800 h-full flex flex-col">
      <div className="rounded-md px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 mb-3">
        Live
      </div>

      {/* This box now flexes to fill the card height (with a sensible minimum) */}
      <div className="bg-black/60 rounded-xl flex-1 min-h-[260px] overflow-auto p-4 flex items-center justify-center">
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
      {/* PREVIEW + LIVE AREA */}
      {/* Make live wider by moving to 6 columns: previews span 4, live spans 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Previews (slightly narrower as a group) */}
        <div className="lg:col-span-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preview 1 – now inside a card frame for consistent look */}
            <PreviewQueueCard slot={1} title="Preview 1 (Queued)" />
            {/* Preview 2 */}
            <SimplePreviewCard slot={2} title="Preview 2" />
            {/* Preview 3 */}
            <SimplePreviewCard slot={3} title="Preview 3" />
            {/* Preview 4 */}
            <SimplePreviewCard slot={4} title="Preview 4" />
          </div>
        </div>

        {/* Live (wider) */}
        <div className="lg:col-span-2">
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
