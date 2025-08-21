import dynamic from 'next/dynamic';
import React, { useEffect, useRef, useState } from 'react'
import { db, dbRef, onValue, set } from '../utils/firebase'
import HymnDisplay from '../components/HymnDisplay'
import BibleDisplay from '../components/BibleDisplay'
import SlidesMini from '../components/SlidesMini'


type SlotData = {
  id: string
  kind?: 'workspace'|'hymn'|'bible'|'slides'
  title?: string
  html?: string
  lines?: string[]
}

/** ---------- Workspace editor ---------- */
function Toolbar({ exec }: { exec: (cmd: string, v?: string) => void }) {
  const [fg, setFg] = useState('#ffffff')
  const [bg, setBg] = useState('#000000')

  return (
    <div className="tb">
      <button onClick={() => exec('bold')}>B</button>
      <button onClick={() => exec('italic')}>I</button>
      <button onClick={() => exec('underline')}>U</button>
      <button onClick={() => exec('justifyLeft')}>L</button>
      <button onClick={() => exec('justifyCenter')}>C</button>
      <button onClick={() => exec('justifyRight')}>R</button>
      <button onClick={() => exec('insertUnorderedList')}>• List</button>
      <button onClick={() => exec('insertOrderedList')}>1. List</button>

      <select onChange={e => exec('fontName', e.target.value)}>
        {['Georgia','Times New Roman','Arial','Verdana','Tahoma','Trebuchet MS','Garamond','Impact'].map(f =>
          <option key={f} value={f}>{f}</option>
        )}
      </select>
      <select defaultValue="5" onChange={e => exec('fontSize', e.target.value)}>
        {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}</option>)}
      </select>

      <label>Color
        <input type="color" value={fg} onChange={e => { setFg(e.target.value); exec('foreColor', e.target.value) }} />
      </label>
      <label>Fill
        <input type="color" value={bg} onChange={e => { setBg(e.target.value); exec('backColor', e.target.value) }} />
      </label>

      <button onClick={() => exec('insertHorizontalRule')}>Insert line</button>
      <button
        onClick={() => document.execCommand(
          'insertHTML',
          false,
          `<div style="display:inline-block;width:140px;height:90px;background:${bg};border:2px solid ${fg};border-radius:10px;"></div>`
        )}
      >
        Insert shape
      </button>
    </div>
  )
}

/** ---------- Preview grid (4 cells) ---------- */
function PreviewGrid() {
  const [slots, setSlots] = useState<Record<number, SlotData | null>>({1:null,2:null,3:null,4:null})

  useEffect(() => {
    const offs = [1,2,3,4].map(i =>
      onValue(dbRef(db, `preview_slots/slot${i}`), s => {
        setSlots(p => ({ ...p, [i]: (s.val() || null) }))
      })
    )
    return () => offs.forEach(off => off())
  }, [])

  const clear = (i:number) => set(dbRef(db, `preview_slots/slot${i}`), null)
  const goLive = async (i:number) => {
    const v = slots[i]
    if (!v) return
    const html = v.html ?? (v.lines ? v.lines.join('<br/>') : '')
    await set(dbRef(db, 'live_content'), {
      id: String(Date.now()),
      html,
      from: v.kind ?? 'workspace',
      title: v.title ?? ''
    })
  }

  const body = (v: SlotData | null | undefined) => {
    if (!v) return <div className="empty">Empty</div>
    const html = v.html ?? (v.lines ? v.lines.join('<br/>') : '')
    return <div className="cell-html" dangerouslySetInnerHTML={{ __html: html }} />
  }

  return (
    <div className="panel">
      <div className="panel-title">Preview</div>
      <div className="preview-grid">
        {[1,2,3,4].map(i => (
          <div key={i} className="preview-cell">
            <div className="cell-head">Preview {i}</div>
            <div className="cell-body">{body(slots[i])}</div>
            <div className="cell-actions">
              <button onClick={() => clear(i)}>Clear</button>
              <button onClick={() => goLive(i)}>Go Live</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** ---------- Page ---------- */
function Operator() {
  const editorRef = useRef<HTMLDivElement>(null)
  const titleRef  = useRef<HTMLInputElement>(null)
  const [slot, setSlot] = useState(1)

  const exec = (cmd: string, val?: string) => document.execCommand(cmd, false, val)

  const sendToPreview = async () => {
    const html  = editorRef.current?.innerHTML ?? ''
    const title = titleRef.current?.value?.trim() || 'Untitled Slide'
    await set(dbRef(db, `preview_slots/slot${slot}`), {
      id: String(Date.now()),
      kind: 'workspace',
      title,
      html
    })
  }

   return (
    <>
      {/* ---- THE LAYOUT: Workspace | Preview | Live --- */}
      <div className="layout">
        {/* left: workspace */}
        <section className="col workspace">
          <div className="panel">
            <div className="panel-title">Workspace</div>

            <div className="ws-head">
              <input ref={titleRef} className="title" placeholder="Untitled Slide" />
              <div className="send">
                <select value={slot} onChange={e => setSlot(Number(e.target.value))}>
                  {[1,2,3,4].map(n => <option key={n} value={n}>Preview {n}</option>)}
                </select>
                <button onClick={sendToPreview}>Send to Preview</button>
              </div>
            </div>

            <Toolbar exec={exec} />

            <div
              ref={editorRef}
              className="editor"
              contentEditable
              suppressContentEditableWarning
            >
              <h1>Good Morning Church</h1>
            </div>
          </div>
        </section>

        {/* middle: preview 2x2 */}
        <section className="col preview">
          <PreviewGrid />
        </section>

        {/* right: live */}
        <section className="col live">
          <div className="panel">
            <div className="panel-title">Live</div>
            <iframe className="live-iframe" src="/live" />
          </div>
        </section>
      </div>

      {/* ---- NEW: bottom row with Hymns / Bible / Slides ---- */}
      <div className="bottom">
        <div className="panel">
          <div className="panel-title">Hymns</div>
          <HymnDisplay />
        </div>
        <div className="panel">
          <div className="panel-title">Bible</div>
          <BibleDisplay />
        </div>
        <div className="panel">
          <div className="panel-title">Slides</div>
          <SlidesMini />
        </div>
      </div>

      {/* --------- PAGE-SCOPED CSS ---------- */}
      <style jsx global>{`
        :root{
          /* same sizing & spacing; ONLY changed the colour scheme below */
          --fg:#e5e7eb;--dim:#94a3b8;--glass:rgba(255,255,255,.06);
        }
        html,body {height:100%}
        body{
          margin:0;color:var(--fg);
          /* lighter wine + royal blue blend (keeps your current vibe) */
          background:
            radial-gradient(80rem 80rem at -10% -10%, rgba(130,48,86,.16), transparent 36%),
            radial-gradient(60rem 60rem at 110% -10%, rgba(45,62,158,.22), transparent 42%),
            linear-gradient(135deg,#0b1220,#111a34);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        }

        /* THE ROW */
        .layout{
          box-sizing:border-box; padding:16px 16px 0 16px;
          display:flex; gap:16px; align-items:stretch;
        }
        .col{min-width:0; display:flex; flex-direction:column}
        .col.workspace{flex:0 0 45%}
        .col.preview  {flex:0 0 35%}
        .col.live     {flex:0 0 20%}

        /* cards */
        .panel{
          background:var(--glass);
          border:1px solid rgba(255,255,255,.08);
          border-radius:12px; padding:14px;
          backdrop-filter: blur(8px);
          box-shadow: 0 18px 36px rgba(0,0,0,.35);
          display:flex; flex-direction:column; min-height:0;
        }
        .panel-title{font-weight:700;margin-bottom:10px}

        /* workspace */
        .ws-head{display:flex; gap:10px; align-items:center; margin-bottom:8px}
        .ws-head .title{
          flex:1; padding:8px 10px; border-radius:8px;
          border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:var(--fg);
        }
        .send select,.send button,.tb button,.tb select,label input[type=color]{
          background:rgba(255,255,255,.08); color:var(--fg);
          border:1px solid rgba(255,255,255,.15); padding:6px 10px; border-radius:8px; cursor:pointer;
        }
        .tb{display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px}
        .editor{
          flex:1; min-height:0; overflow:auto;
          padding:14px; border-radius:10px;
          background: rgba(0,0,0,.35);
          border:1px solid rgba(255,255,255,.12);
        }

        /* preview grid */
        .preview-grid{
          display:grid; grid-template-columns:1fr 1fr; grid-auto-rows:1fr;
          gap:12px; flex:1; min-height:0;
        }
        .preview-cell{
          display:grid; grid-template-rows:auto 1fr auto; min-height:0;
          border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:10px;
          background:#0b0f19;
        }
        .cell-head{color:var(--dim); font-size:.9rem; margin-bottom:4px}
        .cell-body{min-height:0; overflow:auto}
        .cell-html{white-space:pre-wrap}
        .cell-actions{display:flex; gap:8px; margin-top:8px}
        .cell-actions button{
          background:rgba(255,255,255,.08); color:var(--fg);
          border:1px solid rgba(255,255,255,.12); padding:6px 8px; border-radius:8px; cursor:pointer;
        }
        .empty{color:var(--dim)}

        /* live preview */
        .live-iframe{ width:100%; height:100%; border:none; border-radius:12px; background:#000; }

        /* bottom row (new) */
        .bottom{
          display:grid; grid-template-columns: 1fr 1fr 1fr;
          gap:16px; padding:16px;
        }

        /* responsive fallback */
        @media (max-width: 1200px){
          .col.workspace{flex-basis:50%}
          .col.preview{flex-basis:32%}
          .col.live{flex-basis:18%}
          .bottom{grid-template-columns:1fr}
        }
        @media (max-width: 980px){
          .layout{flex-direction:column}
          .col.workspace,.col.preview,.col.live{flex-basis:auto}
          .live-iframe{aspect-ratio:16/9; height:auto}
        }
      `}</style>
    </>
  )
}
 export default dynamic(() => Promise.resolve(Operator), { ssr: false });

