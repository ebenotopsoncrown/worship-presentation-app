import { useState } from 'react'
import { db, ref as dbRef, set, get } from '../utils/firebase'

type Verse = { book_name?: string; chapter?: number; verse?: number; text: string }

export default function BibleDisplay() {
  const [input, setInput] = useState('John 3:16')
  const [verses, setVerses] = useState<Verse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchVerses = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(input)}`)
      if (!res.ok) throw new Error('Verse not found')
      const data = await res.json()
      const fetched: Verse[] = data.verses || [{ text: data.text }]
      setVerses(fetched)
      await set(dbRef(db, 'live_content'), fetched.map(v => (v.text || '').trim()))
      await set(dbRef(db, 'live_state'), { mode: 'content' })
    } catch (e: any) { setError(e.message || 'Failed to fetch') }
    finally { setLoading(false) }
  }

  const addToQueue = async () => {
    if (!verses.length) return
    const qref = dbRef(db, 'queue')
    const snap = await get(qref)
    const list = (snap.val() || []) as any[]
    list.push({
      id: `${Date.now()}-bible`,
      kind: 'bible',
      title: input,
      content: verses.map(v => (v.text || '').trim())
    })
    await set(qref, list)
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Bible Display</h2>
      <div className="flex items-center gap-2 mb-3">
        <input
          className="border px-2 py-1 flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. John 3:16-18"
        />
        <button onClick={fetchVerses} className="px-4 py-2 bg-blue-600 text-white rounded">
          {loading ? 'Loading…' : 'Show Now'}
        </button>
        <button onClick={addToQueue} className="px-3 py-2 border rounded">
          Add to Queue
        </button>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <div className="bg-white p-4 rounded shadow space-y-2">
        {verses.map((v, idx) => (
          <p key={idx} className="text-lg">
            {v.book_name && <span className="font-semibold">{v.book_name} {v.chapter}:{v.verse} </span>}
            {v.text}
          </p>
        ))}
      </div>
    </div>
  )
}
