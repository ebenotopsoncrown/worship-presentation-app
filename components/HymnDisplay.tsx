'use client'
import { useMemo, useState } from 'react'
import hymnsData from '../data/hymns.json'
import { db, ref as dbRef, set, get } from '../utils/firebase'

type Hymn = { title: string; lyrics: string[] }

async function firstEmptySlot() {
  for (let i = 0; i < 4; i++) {
    const s = await get(dbRef(db, `preview_slots/${i}`))
    if (!s.exists() || !s.val()) return i
  }
  return 0
}

export default function HymnDisplay() {
  const [q, setQ] = useState('')
  const hymns = (hymnsData as Hymn[]) || []
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return hymns
    return hymns.filter(h => h.title.toLowerCase().includes(t))
  }, [q])

  const preview = async (h: Hymn) => {
    const pSnap = await get(dbRef(db,'settings/presentation'))
    const hymnLinesPerSlide = Number((pSnap.val()?.hymnLinesPerSlide) ?? 2)
    const slot = await firstEmptySlot()
    await set(dbRef(db, `preview_slots/${slot}`), {
      id: `${Date.now()}-hymn`,
      title: h.title,
      kind: 'hymn',
      lines: h.lyrics,
      groupSize: hymnLinesPerSlide
    })
  }

  const addToQueue = async (h:Hymn) => {
    const qref = dbRef(db,'queue')
    const snap = await get(qref)
    const list = (snap.val() || []) as any[]
    list.push({
      id: `${Date.now()}-hymn`,
      kind: 'hymn',
      title: h.title,
      content: h.lyrics
    })
    await set(qref, list)
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Hymns</h2>
      <input className="border px-3 py-2 rounded w-full mb-2" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search hymns…" />
      <ul className="space-y-1 max-h-60 overflow-auto">
        {list.map((h, i) => (
          <li key={i} className="flex items-center gap-2">
            <button onClick={()=>preview(h)} className="text-blue-700 underline">{h.title}</button>
            <button onClick={()=>addToQueue(h)} className="text-xs px-2 py-1 border rounded">Add to Queue</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
