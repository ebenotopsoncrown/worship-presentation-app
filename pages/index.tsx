import { useEffect, useMemo, useRef, useState } from 'react'
import { db, dbRef, set, onValue } from '../utils/firebase'
import Workspace from '../components/Workspace'
import HymnDisplay from '../components/HymnDisplay'
import BibleDisplay from '../components/BibleDisplay'

type Slot = 1|2|3|4

export default function Operator() {
  // preview HTML in the four cells (live still reads DB)
  const [previewHTML, setPreviewHTML] = useState<Record<Slot,string>>({1:'',2:'',3:'',4:''})
  const [liveHTML, setLiveHTML] = useState<string>('')

  // keep a local mirror of the preview & live content
  useEffect(() => {
    const unsubs = [
      onValue(dbRef(db,'preview_slots/1'), s => setPreviewHTML(p => ({...p,1: (s.val()?.html ?? s.val()?.lines?.join('<br/>') ?? '')}))),
      onValue(dbRef(db,'preview_slots/2'), s => setPreviewHTML(p => ({...p,2: (s.val()?.html ?? s.val()?.lines?.join('<br/>') ?? '')}))),
      onValue(dbRef(db,'preview_slots/3'), s => setPreviewHTML(p => ({...p,3: (s.val()?.html ?? s.val()?.lines?.join('<br/>') ?? '')}))),
      onValue(dbRef(db,'preview_slots/4'), s => setPreviewHTML(p => ({...p,4: (s.val()?.html ?? s.val()?.lines?.join('<br/>') ?? '')}))),
      onValue(dbRef(db,'live_content'), s => setLiveHTML(s.val()?.html ?? s.val()?.lines?.join('<br/>') ?? '')),
    ]
    return () => unsubs.forEach(u => u && u())
  }, [])

  // send any preview cell to live
  const goLive = async (slot: Slot) => {
    const snap = await (await import('firebase/database')).get(dbRef(db,`preview_slots/${slot}`))
    const val = snap.val() || {}
    await set(dbRef(db,'live_content'), {
      id: `from-slot-${slot}-${Date.now()}`,
      title: val.title ?? 'Preview',
      html: val.html ?? (val.lines ? (val.lines as string[]).join('<br/>') : ''),
      kind: val.kind ?? 'html'
    })
  }

  const clearPreview = (slot: Slot) =>
    set(dbRef(db,`preview_slots/${slot}`), { id:`clear-${Date.now()}`, title:'', html:'', kind:'html' })

  return (
    <>
      <div className="op-grid">
        {/* Workspace */}
        <div className="pane">
          <header>Workspace</header>
          <div className="editor">
            <Workspace />
          </div>
        </div>

        {/* Preview (x4) */}
        <div className="pane">
          <header>Preview</header>
          <div className="preview-grid">
            {[1,2,3,4].map(n => (
              <div className="preview-cell" key={n}>
                <div className="frame" dangerouslySetInnerHTML={{__html: previewHTML[n as Slot] || '<div class="muted">Empty</div>'}} />
                <div className="toolbar">
                  <button className="ghost" onClick={()=>clearPreview(n as Slot)}>Clear</button>
                  <button className="primary" onClick={()=>goLive(n as Slot)}>Go Live</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live */}
        <div className="pane">
          <header>Live</header>
          <div className="live-preview">
            <div className="live-frame" dangerouslySetInnerHTML={{__html: liveHTML || '<div class="muted">Nothing live yet</div>'}} />
          </div>
        </div>
      </div>

      {/* Bottom row: Hymns / Bible / Slides */}
      <div className="bottom-grid">
        <div className="section">
          <header>Hymns</header>
          <div className="body">
            <HymnDisplay />
          </div>
        </div>

        <div className="section">
          <header>Bible</header>
          <div className="body">
            <BibleDisplay />
          </div>
        </div>

        <div className="section">
          <header>Slides</header>
          <div className="body">
            <SlidesMini />
          </div>
        </div>
      </div>
    </>
  )
}

/** very small slide library: type text → save → send to preview */
function SlidesMini(){
  const [title,setTitle] = useState('')
  const [text,setText]   = useState('Welcome!')
  const [slot,setSlot]   = useState<1|2|3|4>(1)

  const send = async () => {
    await set(dbRef(db,`preview_slots/${slot}`), {
      id:`slides-${Date.now()}`, title: title || 'Slide',
      html:`<div style="font-size:52px; line-height:1.22">${text.replace(/\n/g,'<br/>')}</div>`,
      kind:'html'
    })
  }

  return (
    <div className="col">
      <div className="row">
        <input className="input" placeholder="Slide title" value={title} onChange={e=>setTitle(e.target.value)} />
        <select value={slot} onChange={e=>setSlot(Number(e.target.value) as 1|2|3|4)}>
          <option value={1}>Preview 1</option>
          <option value={2}>Preview 2</option>
          <option value={3}>Preview 3</option>
          <option value={4}>Preview 4</option>
        </select>
        <button className="primary" onClick={send}>Send to Preview</button>
      </div>
      <textarea className="input" style={{width:'100%', minHeight:120, marginTop:8}} value={text} onChange={e=>setText(e.target.value)} />
    </div>
  )
}

