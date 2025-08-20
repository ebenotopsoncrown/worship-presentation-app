import React, { useMemo, useState } from 'react'
import hymnsData from '../data/mfm_hymns.json'
import { db, dbRef, set } from '../utils/firebase'

type Hymn = {
  id: string
  number: number
  title: string
  firstLine: string
  verses: string[][]
  chorus?: string[]
  searchTokens: string[]
}
const HYMNS = (hymnsData as any).hymns as Hymn[]

export default function HymnDisplay() {
  const [q, setQ] = useState('')
  const [slot, setSlot] = useState(1)

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return HYMNS.slice(0, 30)
    // number search
    if (/^\d+$/.test(s)) {
      return HYMNS.filter(h => String(h.number).startsWith(s)).slice(0, 50)
    }
    // token match
    return HYMNS.filter(h =>
      h.title.toLowerCase().includes(s) ||
      h.firstLine.toLowerCase().includes(s) ||
      h.searchTokens.some(t => t.startsWith(s))
    ).slice(0, 50)
  }, [q])

  function renderPreviewHtml(h: Hymn) {
    const blocks = [
      `<h2 style="margin:0 0 .25em 0">${h.title}</h2>`,
      ...h.verses.map(v => `<p>${v.map(l => escapeHtml(l)).join('<br/>')}</p>`),
      ...(h.chorus ? [`<p><em>${h.chorus.map(l => escapeHtml(l)).join('<br/>')}</em></p>`] : [])
    ]
    return blocks.join('')
  }

  async function send(h: Hymn) {
    const html = renderPreviewHtml(h)
    await set(dbRef(db, `preview_slots/slot${slot}`), {
      id: String(Date.now()),
      kind: 'hymn',
      title: `${h.number}. ${h.title}`,
      html
    })
  }

  return (
    <div className="panel" style={{marginTop:16}}>
      <div className="panel-title">Hymns</div>

      <div style={{display:'flex', gap:8, marginBottom:10}}>
        <input
          placeholder="Search by number, title, or first line…"
          value={q} onChange={e=>setQ(e.target.value)}
          style={{flex:1, padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,.12)', background:'rgba(0,0,0,.25)', color:'inherit'}}
        />
        <select value={slot} onChange={e=>setSlot(Number(e.target.value))}>
          {[1,2,3,4].map(n => <option key={n} value={n}>Preview {n}</option>)}
        </select>
      </div>

      <ul style={{listStyle:'none', padding:0, margin:0, display:'grid', gap:8}}>
        {results.map(h => (
          <li key={h.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, padding:'8px 10px', border:'1px solid rgba(255,255,255,.08)', borderRadius:8, background:'rgba(0,0,0,.25)'}}>
            <div>
              <div style={{fontWeight:600}}>{h.number}. {h.title}</div>
              <div style={{opacity:.65, fontSize:'.9rem'}}>{h.firstLine}</div>
            </div>
            <button onClick={() => send(h)} style={{padding:'6px 10px'}}>Send to Preview</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]!))
}
