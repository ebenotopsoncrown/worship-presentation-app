import React from 'react';
import PreviewQueue from '../components/PreviewQueue';
import HymnDisplay from '../components/HymnDisplay';
import BibleDisplay from '../components/BibleDisplay';
import SlidesMini from '../components/SlidesMini';
import {

  
 type PreviewPanelProps = {
  title: string;
  html?: string | null;
  slot: number;
  onClear: () => void;
  onGoLive?: () => void; // not used for Live panel
};

function PreviewPanel({
  title,
  html,
  slot,
  onClear,
  onGoLive,
}: PreviewPanelProps) {
  return (
    <div className="panel panel--preview">
      <div className="panel-header">{title}</div>

      <div className="preview-frame flex items-center justify-center">
        {html ? (
          <div
            className="w-full text-center leading-tight text-zinc-100"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="text-zinc-400">Empty</div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 gap-2">
        <button onClick={onClear} className="btn btn-ghost">Clear</button>
        {/* Only show Go Live when we have content and this is a preview slot */}
        {onGoLive && (
          <button
            className="btn btn-green"
            onClick={onGoLive}
            disabled={!html}
          >
            Go Live
          </button>
        )}
      </div>
    </div>
  );
}

type LivePanelProps = {
  title: string;
  html?: string | null;
};

function LivePanel({ title, html }: LivePanelProps) {
  return (
    <div className="panel panel--live">
      <div className="panel-header">{title}</div>

      <div className="preview-frame flex items-center justify-center">
        {html ? (
          <div
            className="w-full text-center leading-tight text-zinc-100"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="text-zinc-400">Empty</div>
        )}
      </div>
    </div>
  );
}


/** Shows the current live output. */
function LiveScreen() {
  const [html, setHtml] = React.useState<string>('');

  React.useEffect(() => {
    // simple listener for live_content
    const { listenLiveContent } = require('../utils/firebase');
    const off = listenLiveContent((v: any) => setHtml(v?.html || ''));
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
            {/* Preview 1 – queued controller */}
            <PreviewQueue slot={1} title="Preview 1 (Queued)" />
            {/* Preview 2 */}
            <SimplePreviewCard slot={2} title="Preview 2" />
            {/* Preview 3 */}
            <SimplePreviewCard slot={3} title="Preview 3" />
            {/* Preview 4 */}
            <SimplePreviewCard slot={4} title="Preview 4" />
          </div>
        </div>

        {/* Live */}
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
