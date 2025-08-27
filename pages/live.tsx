'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listenLive } from '../utils/firebase';

/**
 * We accept a few shapes so older senders keep working:
 *  - string HTML
 *  - { html?: string, bg?: string, ts?: number }
 *  - { type: 'image' | 'video', url: string, bg?: string }
 */
type LivePayload =
  | string
  | {
      html?: string;
      url?: string;
      type?: 'html' | 'image' | 'video';
      bg?: string;
      ts?: number;
    }
  | null;

export default function Live() {
  const [payload, setPayload] = useState<LivePayload>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // Subscribes to RTDB /live and auto-unsubscribes on unmount
  useEffect(() => {
    const unsubscribe = listenLive((val) => setPayload(val as LivePayload));
    return unsubscribe;
  }, []);

  // Normalize payload into a single render shape
  const content = useMemo(() => {
    if (typeof payload === 'string') {
      return { kind: 'html' as const, html: payload };
    }
    if (!payload) return { kind: 'empty' as const };

    if (payload.type === 'image' && payload.url) {
      return { kind: 'image' as const, url: payload.url };
    }
    if (payload.type === 'video' && payload.url) {
      return { kind: 'video' as const, url: payload.url };
    }
    return { kind: 'html' as const, html: payload.html ?? '' };
  }, [payload]);

  const bg =
    typeof payload === 'object' && payload && payload.bg
      ? payload.bg
      : '#000';

  return (
    <div className="live-root" style={{ background: bg }}>
      {content.kind === 'html' && (
        <div
          ref={frameRef}
          className="live-html"
          // HTML produced by your editor/slide composer
          dangerouslySetInnerHTML={{ __html: content.html || '' }}
        />
      )}

      {content.kind === 'image' && (
        <img className="live-media" src={content.url!} alt="" />
      )}

      {content.kind === 'video' && (
        <video className="live-media" src={content.url!} autoPlay loop muted />
      )}

      {content.kind === 'empty' && (
        <div className="live-empty">Nothing live</div>
      )}

      {/* Ensure the page actually fills the screen */}
      <style jsx global>{`
        html,
        body,
        #__next {
          height: 100%;
        }
      `}</style>

      {/* Minimal, robust scaling */}
      <style jsx>{`
        .live-root {
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          display: grid;
          place-items: center;
          color: #fff;
        }
        .live-html {
          width: 100%;
          height: 100%;
          display: block;
        }
        .live-media {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain; /* no cropping */
          display: block;
        }
        .live-empty {
          opacity: 0.6;
          font: 600 20px/1.4 system-ui, -apple-system, Segoe UI, Roboto,
            'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji';
        }
      `}</style>
    </div>
  );
}
