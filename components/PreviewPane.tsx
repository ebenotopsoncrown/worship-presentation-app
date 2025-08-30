// components/PreviewPane.tsx
'use client';

import React from 'react';
import type { Slot } from '../utils/firebase';

type PanelProps = { slot: Slot; title: string };
type HtmlProps = { html: string };

/**
 * Default export — keep the same signature used elsewhere (slot + title)
 * This is a simple shell panel; the data rendering is handled by PreviewBoard.tsx
 * or by other listeners in your page.
 */
export default function PreviewPane({ slot, title }: PanelProps) {
  return (
    <div className="rounded-2xl overflow-hidden bg-zinc-900">
      <div className="p-3 text-sm font-semibold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
        {title}
      </div>

      <div className="p-4 min-h-[360px] flex items-center justify-center text-zinc-400">
        {/* Content is populated by the preview listeners elsewhere */}
        Empty
      </div>
    </div>
  );
}

/**
 * Named export for when you want to directly show HTML.
 * Usage: import PreviewPane, { PreviewPaneHtml } from '@/components/PreviewPane'
 */
export function PreviewPaneHtml({ html }: HtmlProps) {
  return (
    <div className="rounded-2xl overflow-hidden bg-zinc-900">
      <div className="p-4 min-h-[360px] flex items-center justify-center">
        <div className="w-full" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
