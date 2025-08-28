// pages/live.tsx
'use client';

import React from 'react';
import { listenLive } from '../utils/firebase';

export default function Live() {
  const [live, setLive] = React.useState<any>(null);

  React.useEffect(() => {
    const off = listenLive(setLive);
    return () => off();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white p-4">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 min-h-[70vh] flex items-center justify-center">
          {!live ? (
            <div className="text-zinc-400">Nothing live</div>
          ) : live.type === 'image' ? (
            // image sized to fit
            <img
              src={live.content}
              alt="Live"
              className="max-w-full max-h-[70vh] object-contain"
            />
          ) : live.type === 'html' ? (
            <div
              className="w-full max-w-5xl mx-auto text-4xl leading-relaxed"
              dangerouslySetInnerHTML={{ __html: live.content }}
            />
          ) : (
            <div className="w-full max-w-5xl mx-auto text-5xl font-semibold">
              {live.content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
