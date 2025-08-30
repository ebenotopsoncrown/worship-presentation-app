'use client';
import React from 'react';
import { type Slot, listenPreviewSlot } from '../utils/firebase';

type Props = { slot: Slot; title: string };

/**
 * Safe component form: returns JSX and never `void`.
 * You can upgrade this to a true queue later; for now it mirrors the slot.
 */
export default function PreviewQueue({ slot, title }: Props) {
  const [text, setText] = React.useState<string>('Empty');

  React.useEffect(() => {
    const off = listenPreviewSlot(slot, (payload) => {
      if (!payload) return setText('Empty');
      if ((payload as any).type === 'html') setText((payload as any).content);
      else if ((payload as any).kind === 'slides') {
        const p = payload as any;
        setText(p.slides?.[p.index ?? 0] ?? '');
      } else setText('Unsupported');
    });
    return off;
  }, [slot]);

  return (
    <div className="rounded-xl bg-zinc-900 text-white overflow-hidden">
      <div className="px-3 py-2 text-sm font-medium bg-gradient-to-r from-amber-500 to-red-500">
        {title}
      </div>
      <div className="p-6 min-h-[120px] flex items-center justify-center text-xl">
        {text || 'Empty'}
      </div>
    </div>
  );
}
