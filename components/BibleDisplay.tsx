'use client'
import { useState } from 'react'
import { db, ref as dbRef, set, get } from '../utils/firebase'

type Verse = { text: string }

const TRANSLATIONS = [
  { code: 'kjv', label: 'KJV' },
  { code: 'web', label: 'WEB' },
  { code: 'asv', label: 'ASV' },
  { code: 'bbe', label: 'BBE' },
]

// helper: pick first empty preview slot (0..3). If all full, reuse slot 0.
async function firstEmptySlot() {
  for (let i = 0; i < 4; i++) {
    const s = await get(dbRef(db, `preview_slots/${i}`))
    if (!s.exists() || !s.val()) return i
  }
  return 0
}

export default function BibleDisplay() {
  const [input, setInput] = useState('John 3:16-18')
  const [version, setVersion] = useState('kjv')
  const [verses, setVerses] = useState<Verse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchVerses = async () => {
    setLoading(true); setError('')
    try {
      const url = `https://bible-api.com/${encodeURIComponent(input)}?translation=${version}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Verse not found')
      const data = await res.json()
      const arr: Verse[] = data.verses || [{ text: data.text }]
      setVerses(arr)

      // ---- NEW BEHAVIOR: send to Preview slot (not Live) ----
      const lines = arr.map(v => (v.text || '').trim())
      const pSnap = await get(dbRef(db, 'settings/presentation'))
      const versesPerSlide = Number((pSnap.val()?.versesPerSlide) ?? 2) // how many verses per live screen
      const slot = await firstEmptySlot()
      await set(dbRef(db, `preview_slots/${slot}`), {
        id: `${Date.now()}-bible`,
        title: `${input} (${version.toUpperCase()})`,
        kind: 'bible',
        lines,
        groupSize: versesPerSlide
      })
      // -------------------------------------------------------
    } catch (e: any) {
      setError(e.message || 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  const addToQueue = async () => {
    if (!verses.length) return
    const qref = dbRef(db, 'queue')
    const snap = await get(qref)
    const list = (snap.val() || []) as any[]
    list.push({
      id: `${Date.now()}-bible`,
      kind: 'bible',
      title: `${input} (${version.toUpperCase()})`,
      content: verses.map(v => (v.text || '').trim())
    })
    await set(qref, list)
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">Bible</h2>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          className="border px-2 py-2 rounded flex-1 min-w-[240px]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. John 3:16-18"
        />
        <select className="border px-2 py-2 rounded" value={version} onChange={(e)=>setVersion(e.target.value)}>
          {TRANSLATIONS.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
        </select>
        <button onClick={fetchVerses} className="px-4 py-2 bg-blue-600 text-white rounded">
          {loading ? 'Loading…' : 'Send to Preview'}
        </button>
        <button onClick={addToQueue} className="px-3 py-2 border rounded">Add to Queue</button>
      </div>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <div className="bg-white p-4 rounded shadow space-y-2">
        {verses.map((v, i) => <p key={i} className="text-lg">{v.text}</p>)}
      </div>
      <p className="text-xs text-gray-500 mt-2">Tip: control “verses per slide” in Theme → Presentation settings.</p>
    </div>
  )
}
