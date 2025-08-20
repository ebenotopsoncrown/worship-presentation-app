import { useState } from 'react'
import { db, dbRef, set } from '../utils/firebase'

type Slot = 1|2|3|4
type Version = 'KJV'|'NIV'|'ESV'

export default function BibleDisplay(){
  const [ref,setRef]   = useState('John 3:16-18')
  const [ver,setVer]   = useState<Version>('KJV')
  const [slot,setSlot] = useState<Slot>(1)
  const [busy,setBusy] = useState(false)

  const fetchVerses = async (reference:string, version:Version) => {
    // If you already have an API route, point to it here:
    try{
      const q = encodeURIComponent(reference.trim())
      const r = await fetch(`/api/bible?q=${q}&v=${version}`)
      if (!r.ok) throw new Error('Bible API failed')
      return await r.json() as { lines: string[], title: string }
    }catch{
      // safe fallback so UI still works
      return {
        title: `${reference} (${version})`,
        lines: [`[Bible API not configured] ${reference} (${version})`]
      }
    }
  }

  const send = async ()=>{
    setBusy(true)
    try{
      const data = await fetchVerses(ref, ver)
      await set(dbRef(db, `preview_slots/slot${slot}`), {
        id: `${Date.now()}-bible`,
        kind: 'bible',
        title: data.title,
        lines: data.lines,
        groupSize: 2
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
      <input value={ref} onChange={e=>setRef(e.target.value)}
        style={{minWidth:220, flex:'1 1 220px', padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.08)', color:'#e5e7eb'}}/>
      <select value={ver} onChange={e=>setVer(e.target.value as Version)}
        style={{padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,.08)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,.15)'}}>
        <option>KJV</option><option>NIV</option><option>ESV</option>
      </select>
      <span style={{opacity:.7}}>→</span>
      <select value={slot} onChange={e=>setSlot(Number(e.target.value) as Slot)}
        style={{padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,.08)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,.15)'}}>
        <option value={1}>Preview 1</option>
        <option value={2}>Preview 2</option>
        <option value={3}>Preview 3</option>
        <option value={4}>Preview 4</option>
      </select>
      <button disabled={busy} onClick={send}
        style={{padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,.08)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,.12)'}}>
        {busy ? 'Sending…' : 'Send to Preview'}
      </button>
    </div>
  )
}
