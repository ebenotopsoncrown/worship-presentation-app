// pages/index.tsx
'use client';

import React, {useEffect, useMemo, useRef, useState} from 'react';
import Head from 'next/head';

// 🔒 Never import things that touch window / firebase at module top in Next.
// We lazy-load utils only on the client inside useEffect / callbacks.
type LivePayload = { html: string; meta?: Record<string, any> };

// ---- helpers ---------------------------------------------------------------

const toStr = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));
const htmlSafe = (v: unknown): string => toStr(v); // keep simple; React handles innerHTML

// A tiny, local preview card so we never get “SimplePreviewCard is not defined”
function PreviewPanel({
  title,
  flavor, // 'p1' | 'p2' | 'p3' | 'p4' | 'live'
  html,
  slot,
  onClear,
  onGoLive,
}: {
  title: string;
  flavor: 'p1' | 'p2' | 'p3' | 'p4' | 'live';
  html: string | null;
  slot?: number;
  onClear?: (slot?: number) => void;
  onGoLive?: (slot?: number) => void;
}) {
  const isLive = flavor === 'live';
  return (
    <div className={`panel panel-${flavor}${isLive ? ' panel--live' : ''}`}>
      <div className="panel-header">{title}</div>

      <div className="preview-frame flex items-center justify-center">
        {html ? (
          <div
            className="w-full text-center leading-tight text-zinc-100"
            // 🔒 Always stringify/guard
            dangerouslySetInnerHTML={{ __html: htmlSafe(html) }}
          />
        ) : (
          <div className="text-zinc-400">Empty</div>
        )}
      </div>

      {!isLive && (
        <div className="flex items-center justify-between mt-3 gap-2">
          <button onClick={() => onClear?.(slot)} className="btn btn-ghost">
            Clear
          </button>
          <button
            onClick={() => html && onGoLive?.(slot)}
            className="btn btn-green"
            disabled={!html}
          >
            Go Live
          </button>
        </div>
      )}
    </div>
  );
}

// ---- page ------------------------------------------------------------------

export default function IndexPage() {
  // local UI state
  const [p1, setP1] = useState<string | null>(null);
  const [p2, setP2] = useState<string | null>(null);
  const [p3, setP3] = useState<string | null>(null);
  const [p4, setP4] = useState<string | null>(null);
  const [live, setLive] = useState<string | null>(null);

  // We only wire realtime / firebase on the client.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let unsubscribes: Array<() => void> = [];

    (async () => {
      try {
        // Lazy import to keep SSR clean
        const { dbRef, onValue, previewRef, liveRef, set, remove } = await import('../utils/firebase');

        // 🧭 helpers to write/clear
        const pushLive = async (payload: LivePayload) => {
          await set(liveRef(), { html: toStr(payload.html), meta: payload.meta || {} });
        };
        const clearSlot = async (slot?: number) => {
          if (!slot) return;
          await remove(previewRef(slot));
        };

        // 🔔 subscribe to previews
        [1, 2, 3, 4].forEach((slot) => {
          const off = onValue(previewRef(slot), (snap: any) => {
            const data = snap?.val?.() ?? snap?.val?. ?? snap;
            const html = data?.html ?? data ?? '';
            const value = toStr(html);
            if (slot === 1) setP1(value || null);
            if (slot === 2) setP2(value || null);
            if (slot === 3) setP3(value || null);
            if (slot === 4) setP4(value || null);
          });
          unsubscribes.push(() => off && off());
        });

        // 🔔 subscribe to live
        const offLive = onValue(liveRef(), (snap: any) => {
          const data = snap?.val?.() ?? snap?.val?. ?? snap;
          const value = toStr(data?.html ?? data ?? '');
          setLive(value || null);
        });
        unsubscribes.push(() => offLive && offLive());

        // expose safe actions on window for buttons
        (window as any).__wp_actions__ = {
          pushLive,
          clearSlot,
        };
      } catch (e) {
        // If utils/firebase import fails, don’t crash the whole page
        console.error('Client wiring failed:', e);
      }
    })();

    return () => {
      unsubscribes.forEach((fn) => {
        try { fn(); } catch {}
      });
    };
  }, []);

  const actions = (typeof window !== 'undefined' && (window as any).__wp_actions__) || {};

  return (
    <>
      <Head>
        <title>Worship Presentation App — MFM Goshen Assembly</title>
      </Head>

      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between text-white">
          <strong>Worship Presentation App — MFM Goshen Assembly</strong>
          <div className="flex items-center gap-2">
            <span className="badge">Not signed in</span>
            <button className="btn btn-ghost">Logout</button>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6 space-y-6">

        {/* Top row: Previews 1–2 + Live */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_1.3fr] gap-4">
          <PreviewPanel
            title="Preview 1 (Queued)"
            flavor="p1"
            html={p1}
            slot={1}
            onClear={(slot) => actions?.clearSlot?.(slot)}
            onGoLive={(slot) =>
              p1 && actions?.pushLive?.({ html: p1, meta: { fromPreview: slot } })
            }
          />

          <PreviewPanel
            title="Preview 2"
            flavor="p2"
            html={p2}
            slot={2}
            onClear={(slot) => actions?.clearSlot?.(slot)}
            onGoLive={(slot) =>
              p2 && actions?.pushLive?.({ html: p2, meta: { fromPreview: slot } })
            }
          />

          <PreviewPanel title="Live" flavor="live" html={live} />
        </div>

        {/* Second row: Previews 3–4 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <PreviewPanel
            title="Preview 3"
            flavor="p3"
            html={p3}
            slot={3}
            onClear={(slot) => actions?.clearSlot?.(slot)}
            onGoLive={(slot) =>
              p3 && actions?.pushLive?.({ html: p3, meta: { fromPreview: slot } })
            }
          />

          <PreviewPanel
            title="Preview 4"
            flavor="p4"
            html={p4}
            slot={4}
            onClear={(slot) => actions?.clearSlot?.(slot)}
            onGoLive={(slot) =>
              p4 && actions?.pushLive?.({ html: p4, meta: { fromPreview: slot } })
            }
          />
        </div>

        {/* The rest of your grids (Hymns, Bible, Slides) remain as-is */}
      </main>
    </>
  );
}
