'use client'
import { useMemo, useState } from 'react'
import mfm from '../data/mfm_hymns.json'
import { db, ref as dbRef, set, get } from '../utils/firebase'

type Hymn = { number: number; title: string; lyrics: string[] }

export default function MfmHymns() {
  const [q, setQ] = useState('')
  const [active, setActive] = useState<Hymn | null>(null)

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return mfm as Hymn[]
    return (mfm as Hymn[]).filter(h =>
      h.title.toLowerCase().includes(term) || String(h.number).startsWith(term)
    )
  }, [q])

  const showNow = async (h: Hymn) => {
    setActive(h)
    await set(dbRef(db, 'live_content'), h.lyrics)
    await set(dbRef(db, 'live_state'), { mode: 'content' })
  }

  const addToQueue = async (h: Hymn) => {
    const qref = dbRef(db, 'queue')
    const snap = await get(qref)
    const items = (snap.val() || []) as any[]
    items.push({
      id: `${Date.now()}-mfm-${h.number}`,
      kind: 'hymn',
      title: `MFM ${h.number}: ${h.title}`,
      content: h.lyrics
    })
    await set(qref, items)
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">MFM Hymns</h2>
      <input className="border px-3 py-2 rounded w-full mb-2"
             placeholder="Search by number or title…"
             value={q} onChange={e=>setQ(e.target.value)} />
      <ul className="space-y-1 max-h-60 overflow-auto">
        {list.map(h => (
          <li key={h.number} className="flex items-center gap-2">
            <button onClick={()=>showNow(h)} className="text-blue-700 underline">
              {h.number}. {h.title}
            </button>
            <button className="text-xs px-2 py-1 border rounded" onClick={()=>addToQueue(h)}>
              Add to Queue
            </button>
          </li>
        ))}
      </ul>

      {active && (
        <div className="mt-4 bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">{active.number}. {active.title}</h3>
          {active.lyrics.map((l,i)=><p key={i} className="my-1">{l}</p>)}
        </div>
      )}
    </div>
  )
}
