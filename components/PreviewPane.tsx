'use client';
import React from 'react';
import {
  type Slot,
  listenPreviewSlot,
  copyPreviewToLive,
  clearPreviewSlot,
} from '../utils/firebase';

type Props = { slot: Slot; title: string };

export default function PreviewPane({ slot, title }: Props) {
  const [content, setContent] = React.useState<string>('Empty');

  React.useEffect(() => {
    const off = listenPreviewSlot(slot, (payload) => {
      if (!payload) return setContent('Empty');
      if ((payload as any).type === 'html') {
        setContent((payload as any).content);
      } else if ((payload as any).kind === 'slides') {
        setContent((payload as any).slides?.[(payload as any).index ?? 0] ?? '');
      } else {
        setContent('Unsupported');
      }
    });
    return off;
  }, [slot]);

  return (
    <div className="rounded-xl bg-zinc-900 text-white overflow-hidden">
      <div className="px-3 py-2 text-sm font-medium bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
        {title}
      </div>
      <div className="p-6 min-h-[180px] flex items-center justify-center text-3xl">
        {content || 'Empty'}
      </div>
      <div className="p-3 flex gap-2">
        <button
          className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500"
          onClick={() => copyPreviewToLive(slot)}
        >
          Go Live
        </button>
        <button
          className="px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600"
          onClick={() => clearPreviewSlot(slot)}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
