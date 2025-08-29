// components/PreviewQueue.tsx
import React, { useEffect, useState } from 'react';
import {
  listenPreviewSlot,
  setPreviewIndex,
  clearPreviewSlot,
  type PreviewPayload,
  type Slot,
} from '../utils/firebase';

// ✅ Make the prop a Slot, not number
export default function PreviewQueue({ slot }: { slot: Slot }) {
  // ...
  useEffect(() => {
    const off = listenPreviewSlot(slot, (payload: PreviewPayload) => {
      // your existing logic
    });
    return off;
  }, [slot]);
}
