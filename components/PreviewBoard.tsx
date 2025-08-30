// components/PreviewBoard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { db, dbRef, onValue, type Slot } from '../utils/firebase';

type HtmlContent = { type: 'html'; content: string };
type SlidesContent = { kind: 'slides'; slides: string[]; index?: number };
type PanelContent = HtmlContent | SlidesContent | null;

// Type guards to narrow the union safely
function isHtml(c: PanelContent): c is HtmlContent {
  return !!c && (c as any).type === 'html';
}
function isSlides(c: PanelContent): c is SlidesContent {
  return !!c && (c as any).kind === 'slides';
}

export default function PreviewPanel({
  slot,
  title,
}: {
  slot: Slot;
  title: string;
}) {
  const [content, setContent] = useState<PanelContent>(null);

  useEffect(() => {
    // ref(db, `previews/${slot}`)
    const unsubscribe = onValue(dbRef(db, `previews/${slot}`), (snap) => {
      setContent((snap.val() as PanelContent) ?? null);
    });

    // onValue returns an unsubscribe function
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [slot]);

  return (
    <div className="rounded-2xl overflow-hidden bg-zinc-900">
      <div className="p-3 text-sm font-semibold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
        {title}
      </div>

      <div className="p-4 min-h-[360px] flex items-center justify-center">
        {isHtml(content) ? (
          <div
            className="w-full"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />
        ) : isSlides(content) ? (
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
