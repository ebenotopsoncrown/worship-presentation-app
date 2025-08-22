'use client';
import { useEffect, useState } from 'react';
import { subscribeToLive } from '../utils/firebase';

type Live = { html?: string; lines?: string[]; title?: string; from?: string };

export default function LivePage() {
  const [live, setLive] = useState<Live | null>(null);

  useEffect(() => {
    const off = subscribeToLive((v) => setLive(v));
    return () => off();
  }, []);

  const html = live?.html ?? (live?.lines ? live.lines.join('<br/>') : '<div style="opacity:.5">Waiting for content…</div>');

  return (
    <div className="live-root">
      <div className="stage" dangerouslySetInnerHTML={{ __html: html }} />
      <style jsx global>{`
        html, body, #__next, .live-root { height:100%; margin:0; background:#000; color:#fff; }
        .live-root { display:flex; align-items:center; justify-content:center; }
        .stage { max-width: 90vw; max-height: 90vh; font-size:52px; line-height:1.22; text-align:center; }
        .stage h1,h2,h3,p{ margin:.2em 0; }
      `}</style>
    </div>
  );
}
