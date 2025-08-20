import { useMemo, useState } from 'react'
import { db, dbRef, set } from '../utils/firebase'
import hymns from '../data/hymns.json' // or your MFM json payload

type Slot = 1|2|3|4
type Hymn = { id: string; title: string; verses: string[] }

export default function HymnDisplay(){
  const [q,setQ] = useState('')
  const [slot,setSlot] = useState<Slot>(1)

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (hymns as Hymn[]).filter(h => h.title.toLowerCase().includes(s)).slice(0,200)
  },[q])

  const send = async (h:Hymn) => {
    await set(dbRef(db,`preview_slots/${slot}`), {
      id: `${h.id}-${Date.now()}`,
      title: h.title,
      lines: h.verses,            // preview shows paged lines
      kind: 'hymn',
      groupSize: 2                // two verses per “page”
    })
  }

  return (
    <div>
      <div className="row" style={{marginBottom:8}}>
        <input className="input" placeholder="Search hymns…" value={q} onChange={e=>setQ(e.target.value)} />
        <span className="muted">Send to</span>
        <select value={slot} onChange={e=>setSlot(Number(e.target.value) as Slot)}>
          <option value={1}>Preview 1</option>
          <option value={2}>Preview 2</option>
          <option value={3}>Preview 3</option>
          <option value={4}>Preview 4</option>
        </select>
      </div>

      <ul style={{listStyle:'none', margin:0, padding:0, maxHeight:280, overflow:'auto'}}>
        {list.map(h => (
          <li key={h.id} className="row" style={{justifyContent:'space-between', padding:'6px 4px'}}>
            <div>{h.title}</div>
            <button className="primary" onClick={()=>send(h)}>Send to Preview</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

