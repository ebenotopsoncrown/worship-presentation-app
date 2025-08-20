// components/QueuePanel.tsx
'use client'
import { useEffect, useState } from 'react'
import { db, ref as dbRef, onValue, set, get, update } from '../utils/firebase'

type Item =
  | { id:string; kind:'hymn'|'bible'|'slide'|'html'; title:string; content:string[] }
  | { id:string; kind:'timer'; title:string; durationSec:number }

type ServiceSet = { id:string; name:string; createdAt:number; items:Item[] }

export default function QueuePanel() {
  const [items, setItems] = useState<Item[]>([])
  const [sets, setSets] = useState<ServiceSet[]>([])
  const [newSetName, setNewSetName] = useState('')
  const [versesPerSlide, setVersesPerSlide] = useState(2)
  const [hymnLinesPerSlide, setHymnLinesPerSlide] = useState(2)

  useEffect(() => {
    const u = onValue(dbRef(db,'queue'), s => setItems(s.val() || []))
    const u2 = onValue(dbRef(db,'service_sets'), s => {
      const v = s.val() || {}; const arr = Object.entries(v).map(([id,val]:any)=>({id,...val}))
      setSets(arr.sort((a,b)=>b.createdAt-a.createdAt))
    })
    const u3 = onValue(dbRef(db,'settings/presentation'), s => {
      const p = s.val() || {}
      setVersesPerSlide(p.versesPerSlide ?? 2)
      setHymnLinesPerSlide(p.hymnLinesPerSlide ?? 2)
    })
    return () => { u(); u2(); u3() }
  }, [])

  const savePresentationSettings = async () => {
    await update(dbRef(db,'settings/presentation'), { versesPerSlide, hymnLinesPerSlide })
  }

  const move = async (i:number, d:-1|1) => {
    const arr = [...items]; const j = i+d; if (j<0 || j>=arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]; await set(dbRef(db,'queue'), arr)
  }
  const remove = async (i:number) => {
    const arr = [...items]; arr.splice(i,1); await set(dbRef(db,'queue'), arr)
  }

  const previewItem = async (it: Item) => {
    // find first empty slot
    let slot = 0
    for (let i=0;i<4;i++){ const s = await get(dbRef(db,`preview_slots/${i}`)); if (!s.exists() || !s.val()){ slot = i; break } }
    if (it.kind === 'timer'){
      await set(dbRef(db, `preview_slots/${slot}`), { id:it.id, title:it.title, kind:'html', html:`<h2>${it.title}</h2><p>${it.durationSec}s</p>` })
      return
    }
    await set(dbRef(db, `preview_slots/${slot}`), {
      id: it.id, title: it.title, kind: it.kind, lines: it.content,
      groupSize: it.kind==='bible' ? versesPerSlide : (it.kind==='hymn'? hymnLinesPerSlide : 1)
    })
  }

  const goLive = async (it: Item) => {
    if (it.kind === 'timer') {
      const endAt = Date.now() + it.durationSec*1000
      await set(dbRef(db,'timer'), { endAt, title: it.title })
      await set(dbRef(db,'live_state'), { mode:'timer' })
      return
    }
    const gs = it.kind==='bible' ? versesPerSlide : (it.kind==='hymn' ? hymnLinesPerSlide : 1)
    await set(dbRef(db,'live_content'), it.content)
    await set(dbRef(db,'live_group_size'), gs)
    await set(dbRef(db,'live_cursor'), 0)
    await set(dbRef(db,'live_state'), { mode: 'content' })
  }

  const next = async () => {
    const sizeSnap = await get(dbRef(db,'live_group_size'))
    const step = Math.max(1, Number(sizeSnap.val() || 1))
    const cur = Number((await get(dbRef(db,'live_cursor'))).val() || 0)
    await set(dbRef(db,'live_cursor'), cur + step)
  }
  const prev = async () => {
    const sizeSnap = await get(dbRef(db,'live_group_size'))
    const step = Math.max(1, Number(sizeSnap.val() || 1))
    const cur = Number((await get(dbRef(db,'live_cursor'))).val() || 0)
    await set(dbRef(db,'live_cursor'), Math.max(0, cur - step))
  }
  const black = async () => set(dbRef(db,'live_state'), { mode:'black' })
  const clear = async () => set(dbRef(db,'live_state'), { mode:'clear' })

  const saveSet = async () => {
    if (!newSetName.trim()) return
    const id = crypto.randomUUID()
    await update(dbRef(db,`service_sets/${id}`), { name: newSetName.trim(), createdAt: Date.now(), items })
    setNewSetName('')
  }
  const loadSetReplace = async (id:string) => {
    const snap = await get(dbRef(db,`service_sets/${id}`))
    const data = snap.val() as ServiceSet
    if (!data) return
    await set(dbRef(db,'queue'), data.items || [])
  }

  const addCountdown = async () => {
    const mins = Number(prompt('Countdown minutes?', '5') || 0); if (!mins) return
    const arr = [...items, { id:`${Date.now()}-timer`, kind:'timer', title:`Countdown ${mins}m`, durationSec: mins*60 }]
    await set(dbRef(db,'queue'), arr)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={prev} className="px-2 py-1 border rounded">Prev</button>
        <button onClick={next} className="px-2 py-1 border rounded">Next</button>
        <button onClick={black} className="px-2 py-1 border rounded">Black</button>
        <button onClick={clear} className="px-2 py-1 border rounded">Clear</button>
        <button onClick={addCountdown} className="px-2 py-1 border rounded">+ Countdown</button>
      </div>

      <div className="bg-white rounded border p-2">
        <div className="font-semibold mb-2">Presentation settings</div>
        <div className="flex gap-2 items-center mb-2">
          <label>Verses per slide</label>
          <input type="number" min={1} value={versesPerSlide}
                 onChange={e=>setVersesPerSlide(Number(e.target.value||1))}
                 className="border px-2 py-1 w-20 rounded"/>
          <label>Hymn lines per slide</label>
          <input type="number" min={1} value={hymnLinesPerSlide}
                 onChange={e=>setHymnLinesPerSlide(Number(e.target.value||1))}
                 className="border px-2 py-1 w-20 rounded"/>
          <button onClick={savePresentationSettings} className="px-2 py-1 border rounded">Save</button>
        </div>
      </div>

      <ul className="divide-y bg-white rounded border">
        {items.map((it,i)=>(
          <li key={it.id} className="flex items-center gap-2 p-2">
            <div className="flex-1">
              <div className="font-semibold">{it.title}</div>
              <div className="text-xs text-gray-500">{it.kind.toUpperCase()}</div>
            </div>
            <button onClick={()=>move(i,-1)} className="px-2 py-1 border rounded">↑</button>
            <button onClick={()=>move(i, +1)} className="px-2 py-1 border rounded">↓</button>
            <button onClick={()=>previewItem(it)} className="px-2 py-1 border rounded">Preview</button>
            <button onClick={()=>goLive(it)} className="px-2 py-1 bg-blue-600 text-white rounded">Go Live</button>
            <button onClick={()=>remove(i)} className="px-2 py-1 border rounded">✕</button>
          </li>
        ))}
        {!items.length && <li className="p-3 text-sm text-gray-500">Queue is empty.</li>}
      </ul>

      <div className="bg-white rounded border p-3">
        <div className="font-semibold mb-2">Service Sets</div>
        <div className="flex gap-2 mb-2">
          <input value={newSetName} onChange={e=>setNewSetName(e.target.value)}
                 placeholder="Service name (e.g., Sunday 9am)" className="border rounded px-2 py-1 flex-1"/>
          <button onClick={saveSet} className="px-2 py-1 border rounded">Save current queue</button>
        </div>
        <ul className="space-y-1 max-h-40 overflow-auto">
          {sets.map(s=>(
            <li key={s.id} className="flex items-center gap-2">
              <span className="flex-1">{s.name}</span>
              <button onClick={()=>loadSetReplace(s.id)} className="px-2 py-1 border rounded">Load (replace)</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
