// components/HymnDisplay.tsx
import React, { useEffect, useMemo, useState } from 'react'
import hymns from '../data/hymns.json'
import { db, dbRef, set } from '../utils/firebase'

type Hymn = { title: string; verses: string[] }

export default function HymnDisplay() {
  const [q, setQ] = useState('')
  const [slot, setSlot] = useState(0)

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return hymns as Hymn[]
    return (hymns as Hymn[]).filter(h => h.title.toLowerCase().includes(term))
  }, [q])

  const sendToPreview = async (h: Hymn) => {
    // Combine verses as HTML blocks (each verse => <p>)
    const lines = h.verses.map(v => `<p>${escapeHtml(v)}</p>`)
    await set(dbRef(db, `preview_board/${slot}`), lines)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          placeholder="Search hymns…"
          value={q}
          onChange={e => setQ(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <select value={slot} onChange={e => setSlot(parseInt(e.target.value,10))} className="border rounded px-2 py-1">
          <option value={0}>Preview 1</option><option value={1}>Preview 2</option><option value={2}>Preview 3</option><option value={3}>Preview 4</option>
        </select>
      </div>

      <ul className="space-y-1">
        {list.map((h, i) => (
          <li key={i} className="flex items-center gap-2">
            <button className="px-2 py-1 rounded border bg-white">{h.title}</button>
            <button className="text-red-500" onClick={() => sendToPreview(h)}>Preview</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m] as string))
}
