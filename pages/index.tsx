// pages/index.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import AppHeader from "../components/AppHeader";
import HymnDisplay from "../components/HymnDisplay";
import BibleDisplay from "../components/BibleDisplay";
import SlidesMini from "../components/SlidesMini";

// IMPORTANT: use the names your firebase util actually exports.
// From your previous logs, the ones that exist are: ref, onValue, set
import { ref, onValue, set } from "../utils/firebase";

/** Helpers */
const toStr = (v: unknown): string => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  try {
    return String(v);
  } catch {
    return "";
  }
};

// Normalize a Realtime Database snapshot value that may be:
// - a plain string
// - an object like { html: string, ... }
// - a raw snapshot fallback
const pickHtml = (snap: any): { html: string; meta?: any } => {
  let raw: any;

  // If it's a Firebase snapshot with .val()
  if (snap && typeof snap.val === "function") {
    raw = snap.val();
  } else {
    raw = snap;
  }

  if (raw && typeof raw === "object" && "html" in raw) {
    return { html: toStr((raw as any).html), meta: (raw as any).meta };
  }

  return { html: toStr(raw), meta: undefined };
};

/** Firebase paths */
const previewPath = (slot: number) => `preview_slots/slot${slot}`;
const livePath = `live_content`;

/** A small preview/live card (keeps your dark theme classes) */
type CardProps = {
  title: string;
  html: string | null;
  onClear?: () => void;
  onGoLive?: () => void;
  rightExtra?: React.ReactNode;
};
const PanelCard: React.FC<CardProps> = ({ title, html, onClear, onGoLive, rightExtra }) => {
  return (
    <div className="panel">
      <div className="panel-header flex items-center justify-between">
        <span>{title}</span>
        <div className="flex items-center gap-2">
          {rightExtra}
        </div>
      </div>

      <div className="preview-frame flex items-center justify-center">
        {html ? (
          <div
            className="w-full text-center leading-tight text-zinc-100"
            // content is already our sanitised string; you were using HTML strings before
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="text-zinc-400">Empty</div>
        )}
      </div>

      {(onClear || onGoLive) && (
        <div className="flex items-center justify-between mt-3 gap-2">
          {onClear && (
            <button onClick={onClear} className="btn btn-ghost">
              Clear
            </button>
          )}
          <div className="flex-1" />
          {onGoLive && (
            <button
              onClick={onGoLive}
              className="btn btn-green"
              disabled={!html}
              title={!html ? "Nothing to send" : "Send to Live"}
            >
              Go Live
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default function IndexPage() {
  // preview HTML values
  const [p1, setP1] = useState<string | null>(null);
  const [p2, setP2] = useState<string | null>(null);
  const [p3, setP3] = useState<string | null>(null);
  const [p4, setP4] = useState<string | null>(null);

  // live HTML + meta (so we can clear live if a preview that fed it is cleared)
  const [liveHtml, setLiveHtml] = useState<string | null>(null);
  const [liveMeta, setLiveMeta] = useState<any>(null);

  /** Subscribe to the 4 previews */
  useEffect(() => {
    const offs: Array<() => void> = [];

    [1, 2, 3, 4].forEach((slot) => {
      const off = onValue(ref(previewPath(slot)), (snap: any) => {
        const { html } = pickHtml(snap);
        const value = html || null;

        if (slot === 1) setP1(value);
        if (slot === 2) setP2(value);
        if (slot === 3) setP3(value);
        if (slot === 4) setP4(value);
      });
      // save unsubscribe
      offs.push(off as unknown as () => void);
    });

    return () => {
      offs.forEach((fn) => {
        try { fn && fn(); } catch {}
      });
    };
  }, []);

  /** Subscribe to live */
  useEffect(() => {
    const offLive = onValue(ref(livePath), (snap: any) => {
      const { html, meta } = pickHtml(snap);
      setLiveHtml(html || null);
      setLiveMeta(meta || null);
    });
    return () => {
      try { (offLive as unknown as () => void)(); } catch {}
    };
  }, []);

  /** Writers */
  const clearPreviewSlot = useCallback(async (slot: number) => {
    await set(ref(previewPath(slot)), null);

    // if live currently shows that slot, clear it as well
    if (liveMeta && liveMeta.fromPreview === slot) {
      await set(ref(livePath), null);
    }
  }, [liveMeta]);

  const goLiveFromSlot = useCallback(async (slot: number) => {
    const value = slot === 1 ? p1 : slot === 2 ? p2 : slot === 3 ? p3 : p4;
    if (!value) return;

    await set(ref(livePath), {
      html: value,
      meta: {
        fromPreview: slot,
        ts: Date.now(),
      },
    });
  }, [p1, p2, p3, p4]);

  /** UI */
  const previews = useMemo(
    () => [
      { slot: 1, title: "Preview 1 (Queued)", html: p1, clear: () => clearPreviewSlot(1), go: () => goLiveFromSlot(1) },
      { slot: 2, title: "Preview 2", html: p2, clear: () => clearPreviewSlot(2), go: () => goLiveFromSlot(2) },
      { slot: 3, title: "Preview 3", html: p3, clear: () => clearPreviewSlot(3), go: () => goLiveFromSlot(3) },
      { slot: 4, title: "Preview 4", html: p4, clear: () => clearPreviewSlot(4), go: () => goLiveFromSlot(4) },
    ],
    [p1, p2, p3, p4, clearPreviewSlot, goLiveFromSlot]
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6 space-y-6">
      <AppHeader />

      {/* top grid: previews + live (keeps your panel sizing; adjust with Tailwind if needed) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* two rows of two previews */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {previews.slice(0, 2).map((p) => (
              <PanelCard
                key={p.slot}
                title={p.title}
                html={p.html}
                onClear={p.clear}
                onGoLive={p.go}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {previews.slice(2, 4).map((p) => (
              <PanelCard
                key={p.slot}
                title={p.title}
                html={p.html}
                onClear={p.clear}
                onGoLive={p.go}
              />
            ))}
          </div>
        </div>

        {/* live column */}
        <div className="lg:col-span-1">
          <PanelCard
            title="Live"
            html={liveHtml}
            // Live card has no GoLive; clear only from the preview that fed it (handled in clearPreviewSlot)
            onClear={undefined}
            rightExtra={
              <span className="text-xs text-zinc-300">
                {liveMeta?.fromPreview ? `from Preview ${liveMeta.fromPreview}` : ""}
              </span>
            }
          />
        </div>
      </div>

      {/* bottom grid: Hymns / Bible / Slides (unchanged components) */}
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
