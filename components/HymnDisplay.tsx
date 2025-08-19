import { useState } from 'react'
import hymns from '../data/hymns.json'
import { db, ref as dbRef, set, get } from '../utils/firebase'

export default function HymnDisplay() {
  const [selectedHymn, setSelectedHymn] = useState<number | null>(null)

  const showNow = async (idx: number) => {
    setSelectedHymn(idx)
    await set(dbRef(db, 'live_content'), hymns[idx].lyrics)
    await set(dbRef(db, 'live_state'), { mode: 'content' })
  }

  const addToQueue = async (idx: number) => {
    const qref = dbRef(db, 'queue')
    const snap = await get(qref)
    const list = (snap.val() || []) as any[]
    list.push({
      id: `${Date.now()}-${idx}`,
      kind: 'hymn',
      title: hymns[idx].title,
      content: hymns[idx].lyrics
    })
    await set(qref, list)
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Select a Hymn</h2>
      <ul className="space-y-2">
        {hymns.map((h: any, idx: number) => (
          <li key={idx} className="flex items-center gap-2">
            <button onClick={() => showNow(idx)} className="text-blue-700 underline">
              {h.title}
            </button>
            <button onClick={() => addToQueue(idx)} className="text-xs px-2 py-1 border rounded">
              Add to Queue
            </button>
          </li>
        ))}
      </ul>

      {selectedHymn !== null && (
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold">{hymns[selectedHymn].title}</h3>
          {hymns[selectedHymn].lyrics.map((line: string, i: number) => (
            <p key={i} className="my-1">{line}</p>
          ))}
        </div>
      )}
    </div>
  )
}
