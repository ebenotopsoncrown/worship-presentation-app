// components/PreviewBoard.tsx
import React, { useEffect, useState } from 'react'
import type { Slot } from '../utils/firebase';

const SLOT_COUNT = 4

export default function PreviewPanel({ slot, title }: { slot: Slot; title: string }) {
  // ...
}
  useEffect(() => {
    const off = onValue(dbRef(db, 'preview_board'), snap => {
      const v = snap.val() as string[][] | null
      const filled = Array.from({ length: SLOT_COUNT }, (_, i) => (v && v[i]) || [])
      setBoard(filled)
    })
    return () => off()
  }, [])

  const goLive = async (i: number) => {
    await set(dbRef(db, 'live_content'), board[i] || [])
    await set(dbRef(db, 'live_mode'), 'content')
  }
  const clearSlot = async (i: number) => {
    await set(dbRef(db, `preview_board/${i}`), [])
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {board.map((group, i) => (
        <div key={i} className="rounded border border-gray-300 bg-white">
          <div className="flex items-center justify-between px-2 py-1 border-b">
            <div className="text-sm font-semibold">Preview {i + 1}</div>
            <div className="space-x-2">
              <button onClick={() => clearSlot(i)} className="text-xs px-2 py-1 rounded bg-gray-200">Clear</button>
              <button onClick={() => goLive(i)} className="text-xs px-2 py-1 rounded bg-emerald-600 text-white">Go Live</button>
            </div>
          </div>
          <div className="p-2 text-xs space-y-1">
            {group.length === 0 && <div className="text-gray-400">Empty</div>}
            {group.map((l, j) => (
              <div key={j} className="truncate" dangerouslySetInnerHTML={{ __html: l }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
