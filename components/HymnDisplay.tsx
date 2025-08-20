import { useMemo, useState } from 'react'
import { db, dbRef, set } from '../utils/firebase'

type Slot = 1|2|3|4
type Hymn = { id: string; title: string; verses: string[] }

/** Supply your MFM hymn JSON at /data/hymns.json with {id,title,verses[]} */
import hymnsData from '../data/hymns.json'

export default function HymnDisplay(){
  const [q,setQ] = useState('')
  const [slot,setSlot] = useState<Slot>(1)

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    const arr = (hymnsData as Hymn[]) || []
    return s ? arr.filter(h => h.title.toLowerCase().includes(s)).slice(0,300) : arr.slice(0,300)
  },[q])

  const send = async (h:Hymn) => {
    await set(dbRef(db, `preview_slots/slot${slot}`), {
      id: `${h.id}-${Date.now()}`,
      kind: 'hymn',
      title: h.title,
      lines: h.verses,
      groupSize: 2
    })
  }

  return (
    <div>
      <div style={{display:'flex', gap:8, marginBottom:8, alignItems:'center'}}>
        <input
          placeholder="Search hymns…"
          onChange={e=>setQ(e.target.value)}
          style={{flex:1, padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.08)', color:'#e5e7eb'}}
        />
        <span style={{opacity:.7}}>Send to</span>
        <select value={slot} onChange={e=>setSlot(Number(e.target.value) as Slot)}
          style={{padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,.08)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,.15)'}}>
          <option value={1}>Preview 1</option>
          <option value={2}>Preview 2</option>
          <option value={3}>Preview 3</option>
          <option value={4}>Preview 4</option>
        </select>
      </div>

      <div style={{maxHeight:280, overflow:'auto'}}>
        {(list as Hymn[]).map(h => (
          <div key={h.id} style={{display:'flex', justifyContent:'space-between', padding:'6px 4px', borderBottom:'1px solid rgba(255,255,255,.06)'}}>
            <div>{h.title}</div>
            <button onClick={()=>send(h)}
              style={{padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,.08)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,.12)'}}>
              Send to Preview
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
