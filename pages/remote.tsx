// pages/remote.tsx
import dynamic from 'next/dynamic'
import React, { useEffect, useState } from 'react'
import { db, dbRef, set, onValue } from '../utils/firebase'

function RemotePage() {
  const [preview, setPreview] = useState<string[][]>([])
  const [slot, setSlot] = useState(0)

  useEffect(() => {
    const u = onValue(dbRef(db, 'preview_board'), s => {
      setPreview((s.val() as string[][]) || [])
    })
    return () => u()
  }, [])

  const goLive = async (i: number) => {
    const group = preview[i] || []
    await set(dbRef(db, 'live_content'), group)
    await set(dbRef(db, 'live_mode'), 'content')
  }
  const clear = async () => set(dbRef(db, 'live_mode'), 'clear')
  const black = async () => set(dbRef(db, 'live_mode'), 'black')

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <button onClick={black} className="px-3 py-1 rounded bg-black text-white">Black</button>
        <button onClick={clear} className="px-3 py-1 rounded bg-gray-200">Clear</button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {preview.map((group, i) => (
          <div key={i} className={`rounded border p-3 ${i === slot ? 'border-blue-500' : 'border-gray-300'}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-semibold">Slot {i + 1}</div>
              <div className="space-x-2">
                <button className="text-xs px-2 py-1 bg-sky-600 text-white rounded" onClick={() => setSlot(i)}>
                  Preview
                </button>
                <button className="text-xs px-2 py-1 bg-emerald-600 text-white rounded" onClick={() => goLive(i)}>
                  Go Live
                </button>
              </div>
            </div>
            <ul className="text-xs">
              {group.map((l, j) => <li key={j}>{l}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(RemotePage), { ssr: false })
