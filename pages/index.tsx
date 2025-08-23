'use client';

import React from 'react';
import AppHeader from '../components/AppHeader';
import PreviewQueue from '../components/PreviewQueue';
import HymnDisplay from '../components/HymnDisplay';
import BibleDisplay from '../components/BibleDisplay';
import SlidesMini from '../components/SlidesMini';

// Use the primitives that are already exported by your utils/firebase
import { db, dbRef, onValue, set } from '../utils/firebase';

/* ---------------------------------- */
/* Shared visual card used by previews */
/* ---------------------------------- */
type PreviewPanelProps = {
  title: string;
  html?: string | null;
  onClear: () => void;
  onGoLive?: () => void; // hidden when not provided
};

function PreviewPanel({ title, html, onClear, onGoLive }: PreviewPanelProps) {
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
        {onGoLive && (
          <button className="btn btn-green" onClick={onGoLive} disabled={!html}>
            Go Live
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- */
/* Simple preview card for slots 2–4   */
/* Subscribes to /preview_slots/slotN  */
/* ---------------------------------- */
function SimplePreviewCard({ slot, title }: { slot: 2 | 3 | 4; title: string }) {
  const [html, setHtml] = React.useState<string>('');

  React.useEffect(() => {
    const off = onValue(dbRef(db, `preview_slots/slot${slot}`), (snap) => {
      const v = snap.val();
      // slot may contain { html } or { slides, index }
      if (!v) {
        setHtml('');
        return;
      }
      if (Array.isArray(v?.slides)) {
        const i = Number(v.index ?? 0);
        setHtml(String(v.slides[i] ?? ''));
      } else {
        setHtml(String(v?.html ?? ''));
      }
    });
    return () => off();
  }, [slot]);

  const clear = () => set(dbRef(db, `preview_slots/slot${slot}`), null);
  const goLive = () =>
    html && set(dbRef(db, 'live_content'), { html, meta: { fromPreview: slot } });

  return (
    <PreviewPanel title={title} html={html} onClear={clear} onGoLive={goLive} />
  );
}

/* ------------------------------ */
/* Right-side live output monitor  */
/* ------------------------------ */
function LiveScreen() {
  const [html, setHtml] = React.useState<string>('');

  React.useEffect(() => {
    const off = onValue(dbRef(db, 'live_content'), (snap) => {
      const v = snap.val();
      setHtml(String(v?.html ?? ''));
    });
    return () => off();
  }, []);

  return (
    <div className="panel panel--live">
      <div className="panel-header">Live</div>
      <div className="preview-frame flex items-center justify-center">
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

/* --------------- */
/* Page component  */
/* --------------- */
export default function IndexPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AppHeader />

      <div className="p-4 md:p-6 space-y-6">
        {/* PREVIEW AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preview 1 (queued controller) */}
              <PreviewQueue slot={1} title="Preview 1 (Queued)" />

              {/* Preview 2–4 */}
              <SimplePreviewCard slot={2} title="Preview 2" />
              <SimplePreviewCard slot={3} title="Preview 3" />
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
    </div>
  );
}
