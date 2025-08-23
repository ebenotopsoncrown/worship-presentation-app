import React from 'react';
import PreviewQueue from '../components/PreviewQueue';
import HymnDisplay from '../components/HymnDisplay';
import BibleDisplay from '../components/BibleDisplay';
import SlidesMini from '../components/SlidesMini';
import { listenPreviewSlot, setLiveContent, clearPreviewSlot, PreviewPayload } from '../utils/firebase';

function SimplePreviewCard({ slot, title, flavor }: { slot: number; title: string; flavor: 'p2'|'p3'|'p4' }) {
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
  <div className={`panel panel-${flavor} ${flavor === 'live' ? 'panel--live' : ''}`}>
    <div className="panel-header">{title}</div>

    <div className="preview-frame flex items-center justify-center">
      {html ? (
        <div
          className={`w-full text-center leading-tight text-zinc-100 ${
            flavor === 'live' ? 'live-html' : ''
          }`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="text-zinc-400">Empty</div>
      )}
    </div>

    <div className="flex items-center justify-between mt-3 gap-2">
      <button
        onClick={() => clearPreviewSlot(slot)}
        className="btn btn-ghost"
      >
        Clear
      </button>

      <button
        onClick={() =>
          html && setLiveContent({ html, meta: { fromPreview: slot } })
        }
        className="btn btn-green"
        disabled={!html}
      >
        Go Live
      </button>
    </div>
  </div>
);


function LiveScreen() {
  const [html, setHtml] = React.useState<string>('');

  React.useEffect(() => {
    const { listenLiveContent } = require('../utils/firebase');
    const off = listenLiveContent((v: any) => setHtml(v?.html || ''));
    return () => off();
  }, []);

  return (
    <div className="panel panel--live h-full">
      <div className="panel-header">Live</div>
      <div className="preview-frame flex items-center justify-center">
        {html ? (
          <div
            className="w-full text-center text-zinc-50 text-3xl md:text-4xl leading-tight"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="text-zinc-400">Nothing live</div>
        )}
      </div>
    </div>
  );
}

export default function IndexPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6 space-y-6">

      {/* PREVIEW + LIVE AREA */}
      {/* lg: 5 cols (previews 3, live 2)  |  xl: 7 cols (previews 4, live 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-7 gap-6">
        {/* Previews block (narrower than before) */}
        <div className="lg:col-span-3 xl:col-span-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preview 1 (Queued) wrapped in panel for consistent look */}
            <div className="panel panel--p1">
              {/* If PreviewQueue already renders its own header, keep it.
                  Otherwise uncomment next line: */}
              {/* <div className="panel-header">Preview 1 (Queued)</div> */}
              <PreviewQueue slot={1} title="Preview 1 (Queued)" />
            </div>

            <SimplePreviewCard slot={2} title="Preview 2" flavor="p2" />
            <SimplePreviewCard slot={3} title="Preview 3" flavor="p3" />
            <SimplePreviewCard slot={4} title="Preview 4" flavor="p4" />
          </div>
        </div>

        {/* Live block (wider than before) */}
        <div className="lg:col-span-2 xl:col-span-3">
          <LiveScreen />
        </div>
      </div>

      {/* CONTENT PANELS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <HymnDisplay />
        <BibleDisplay />
        <SlidesMini />
      </div>
    </div>
  );
}
