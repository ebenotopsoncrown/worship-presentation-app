// components/PreviewBoard.tsx
'use client'
import { useEffect, useState } from 'react'
import { db, ref as dbRef, onValue, set, get } from '../utils/firebase'

type Slot = {
  id: string
  title: string
  kind: 'bible'|'hymn'|'slide'|'html'
  lines?: string[]        // for bible/hymn/slide text
  html?: string           // for rich HTML from Workspace
  groupSize?: number      // how many lines/verses per slide
} | null

const SLOT_COUNT = 4

export default function PreviewBoard() {
  const [slots, setSlots] = useState<Slot[]>(Array(SLOT_COUNT).fill(null))

  useEffect(() => {
    const unsubs = Array.from({length:SLOT_COUNT}, (_,i)=>{
      return onValue(dbRef(db, `preview_slots/${i}`), s => {
        setSlots(prev => {
          const copy = prev.slice()
          copy[i] = s.val() || null
          return copy
        })
      })
    })
    return () => unsubs.forEach(u=>u())
  }, [])

  const clearSlot = async (i:number) => set(dbRef(db, `preview_slots/${i}`), null)

  const goLive = async (i:number) => {
    const slot = slots[i]
    if (!slot) return
    if (slot.html) {
      await set(dbRef(db, 'live_content'), [slot.html])
      await set(dbRef(db, 'live_group_size'), 1)
      await set(dbRef(db, 'live_state'), { mode:'content' })
      await set(dbRef(db, 'live_cursor'), 0)
      return
    }
    const lines = slot.lines || []
    const gs = Math.max(1, slot.groupSize || 1)
    await set(dbRef(db, 'live_content'), lines)
    await set(dbRef(db, 'live_group_size'), gs)
    await set(dbRef(db, 'live_state'), { mode:'content' })
    await set(dbRef(db, 'live_cursor'), 0)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {slots.map((slot, i) => (
          <div key={i} className="bg-white rounded border shadow p-3 min-h-[180px] flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="font-semibold flex-1">Preview {i+1}</div>
              <button onClick={()=>clearSlot(i)} className="px-2 py-1 border rounded">Clear</button>
              <button onClick={()=>goLive(i)} className="px-2 py-1 bg-blue-600 text-white rounded">Go Live</button>
            </div>
            {!slot && <div className="text-sm text-gray-500">Empty</div>}
            {slot && (
              <>
                <div className="text-xs text-gray-500 mb-1">{slot.kind.toUpperCase()}</div>
                <div className="overflow-auto text-sm" style={{maxHeight:180}}>
                  {slot.html ? (
                    <div dangerouslySetInnerHTML={{ __html: slot.html }} />
                  ) : (
                    (slot.lines || []).map((l,idx)=> <div key={idx} className="mb-1">• {l}</div>)
                  )}
                </div>
                {slot.lines && <div className="text-xs mt-1 opacity-70">Group size: {slot.groupSize || 1}</div>}
              </>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">Tip: Bible/Hymn selections and Workspace previews fill the first empty slot.</p>
    </div>
  )
}
