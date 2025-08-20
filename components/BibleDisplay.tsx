import { useState } from 'react'
import { db, dbRef, set } from '../utils/firebase'

type Slot = 1|2|3|4
type Version = 'KJV'|'NIV'|'ESV'

export default function BibleDisplay(){
  const [ref,setRef] = useState('John 3:16-18')
  const [ver,setVer] = useState<Version>('KJV')
  const [slot,setSlot] = useState<Slot>(1)
  const [busy,setBusy] = useState(false)

  const fetchVerses = async (reference:string, version:Version) => {
    // Use your live Bible API here – this demo uses scripture.api.bible-like format
    // Replace with your actual endpoint/headers (we used a generic free endpoint earlier)
    const q = encodeURIComponent(reference.trim())
    const r = await fetch(`/api/bible?q=${q}&v=${version}`)
    if(!r.ok) throw new Error('Bible API failed')
    const data = await r.json() as { lines: string[], title: string }
    return data
  }

  const send = async () => {
    try{
      setBusy(true)
      const data = await fetchVerses(ref, ver)
      await set(dbRef(db,`preview_slots/${slot}`), {
        id:`${Date.now()}-bible`,
        title:`${ref} (${ver})`,
        lines: data.lines,
        kind: 'bible',
        groupSize: 2
      })
    } finally { setBusy(false) }
  }

  return (
    <div className="row" style={{gap:8, flexWrap:'wrap'}}>
      <input className="input" style={{minWidth:220}} value={ref} onChange={e=>setRef(e.target.value)} />
      <select value={ver} onChange={e=>setVer(e.target.value as Version)}>
        <option>KJV</option><option>NIV</option><option>ESV</option>
      </select>
      <span className="muted">→</span>
      <select value={slot} onChange={e=>setSlot(Number(e.target.value) as Slot)}>
        <option value={1}>Preview 1</option>
        <option value={2}>Preview 2</option>
        <option value={3}>Preview 3</option>
        <option value={4}>Preview 4</option>
      </select>
      <button className="primary" disabled={busy} onClick={send}>{busy?'Sending…':'Send to Preview'}</button>
    </div>
  )
}

