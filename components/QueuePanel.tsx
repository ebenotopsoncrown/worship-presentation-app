import { useEffect, useState } from 'react'
import { db, ref as dbRef, onValue, set, get } from '../utils/firebase'

type QueueItem = {
  id: string
  kind: 'hymn' | 'bible' | 'slide'
  title: string
  content: string[] // text lines or ['<img ...>']
}

export default function QueuePanel() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(-1)

  // Live helpers
  const goLiveIndex = async (idx: number) => {
    if (idx < 0 || idx >= queue.length) return
    await set(dbRef(db, 'live_content'), queue[idx].content)
    await set(dbRef(db, 'live_state'), { mode: 'content' })
    await set(dbRef(db, 'queue_current'), idx)
  }
  const next = () => goLiveIndex(currentIndex + 1)
  const prev = () => goLiveIndex(currentIndex - 1)

  const setBlack = async () => {
    await set(dbRef(db, 'live_state'), { mode: 'black' })
  }
  const setClear = async () => {
    await set(dbRef(db, 'live_state'), { mode: 'clear' })
  }

  // Load queue + current index in realtime
  useEffect(() => {
    const u1 = onValue(dbRef(db, 'queue'), snap => setQueue(snap.val() || []))
    const u2 = onValue(dbRef(db, 'queue_current'), snap => setCurrentIndex(snap.val() ?? -1))
    return () => { u1(); u2() }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
      if (e.key.toLowerCase() === 'b') { e.preventDefault(); setBlack() }
      if (e.key.toLowerCase() === 'c') { e.preventDefault(); setClear() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentIndex, queue])

  // Queue ops
  const writeQueue = async (items: QueueItem[]) => set(dbRef(db, 'queue'), items)

  const move = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= queue.length) return
    const copy = [...queue]
    ;[copy[idx], copy[target]] = [copy[target], copy[idx]]
    await writeQueue(copy)
  }

  const removeAt = async (idx: number) => {
    const copy = queue.filter((_, i) => i !== idx)
    await writeQueue(copy)
    // adjust current index if needed
    const newCurrent = currentIndex >= copy.length ? copy.length - 1 : currentIndex
    await set(dbRef(db, 'queue_current'), newCurrent)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <button onClick={prev} className="px-3 py-1 bg-gray-700 text-white rounded">◀ Prev</button>
        <button onClick={next} className="px-3 py-1 bg-gray-700 text-white rounded">Next ▶</button>
        <button onClick={setBlack} className="px-3 py-1 bg-black text-white rounded">Black</button>
        <button onClick={setClear} className="px-3 py-1 bg-white text-black border rounded">Clear</button>
        <span className="ml-2 text-sm text-gray-600">Shortcuts: ←/→/Space, B, C</span>
      </div>

      <ul className="space-y-2">
        {queue.map((item, idx) => (
          <li key={item.id} className={`p-3 rounded border bg-white flex items-center gap-2 ${idx === currentIndex ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="text-xs uppercase text-gray-500 w-16">{item.kind}</div>
            <div className="flex-1">
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-gray-500 truncate">{item.content[0]?.replace(/<[^>]*>/g, '').slice(0, 80)}</div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => move(idx, -1)} className="px-2 py-1 border rounded">↑</button>
              <button onClick={() => move(idx, 1)} className="px-2 py-1 border rounded">↓</button>
              <button onClick={() => goLiveIndex(idx)} className="px-3 py-1 bg-blue-600 text-white rounded">Go Live</button>
              <button onClick={() => removeAt(idx)} className="px-2 py-1 border rounded text-red-600">✕</button>
            </div>
          </li>
        ))}
      </ul>
      {queue.length === 0 && <p className="text-gray-500">Queue is empty. Use “Add to Queue” in Hymns/Bible/Slides.</p>}
    </div>
  )
}
