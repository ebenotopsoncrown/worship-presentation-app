// components/PreviewBoard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { dbRef, onValue, type Slot } from '../utils/firebase';

type PanelContent =
  | { type: 'html'; content: string }
  | { kind: 'slides'; slides: string[]; index?: number }
  | null;

export default function PreviewPanel({
  slot,
  title,
}: {
  slot: Slot;
  title: string;
}) {
  const [content, setContent] = useState<PanelContent>(null);

  useEffect(() => {
    const off = onValue(dbRef('' as any, `previews/${slot}`), snap => {
      setContent((snap.val() as PanelContent) ?? null);
    });
    return () => {
      // in compat/v9 onValue returns an unsubscribe function
      if (typeof off === 'function') off();
    };
  }, [slot]);

  return (
    <div className="rounded-2xl overflow-hidden bg-zinc-900">
      <div className="p-3 text-sm font-semibold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
        {title}
      </div>

      <div className="p-4 min-h-[360px] flex items-center justify-center">
        {content?.type === 'html' ? (
          <div
            className="w-full"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />
        ) : content?.kind === 'slides' ? (
          <div className="text-zinc-200">
            {content.slides?.[content.index ?? 0] ?? 'Empty'}
          </div>
        ) : (
          <div className="text-zinc-400">Empty</div>
        )}
      </div>
    </div>
  );
}
