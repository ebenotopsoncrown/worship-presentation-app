'use client';
import dynamic from 'next/dynamic';
import React, { useEffect, useRef, useState } from 'react';
import HymnDisplay from '../components/HymnDisplay';
import BibleDisplay from '../components/BibleDisplay';
import SlidesMini from '../components/SlidesMini';
import {
  db, dbRef, set,
  setPreviewSlot, subscribeToPreviewSlot,
  setLiveContent,
  subscribeConnected,
  auth, onAuthStateChanged, signInAnonymously
} from '../utils/firebase';

type SlotData = {
  id: string;
  kind?: 'workspace'|'hymn'|'bible'|'slides';
  title?: string;
  html?: string;
  lines?: string[];
};

function Toolbar({ exec }: { exec: (cmd: string, v?: string) => void }) {
  const [fg, setFg] = useState('#ffffff');
  const [bg, setBg] = useState('#000000');
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
        <input type="color" value={fg} onChange={e => { setFg(e.target.value); exec('foreColor', e.target.value); }} />
      </label>
      <label>Fill
        <input type="color" value={bg} onChange={e => { setBg(e.target.value); exec('backColor', e.target.value); }} />
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
  );
}

function PreviewGrid() {
  const [slots, setSlots] = useState<Record<number, SlotData | null>>({1:null,2:null,3:null,4:null});
  const [sending, setSending] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const unsubs = [1,2,3,4].map(i =>
      subscribeToPreviewSlot(
        i,
        (val) => setSlots(p => ({ ...p, [i]: val })),
        (err) => console.error('Preview subscription error (slot '+i+'):', err)
      )
    );
    return () => unsubs.forEach(u => u());
  }, []);

  const clear = (i:number) => set(dbRef(db, `preview_slots/slot${i}`), null);

  const goLive = async (i:number) => {
    const v = slots[i];
    if (!v) return;
    try {
      setSending(s => ({ ...s, [i]: true }));
      const html = v.html ?? (v.lines ? v.lines.join('<br/>') : '');
      await setLiveContent({
        id: String(Date.now()),
        from: v.kind ?? 'workspace',
        title: v.title ?? '',
        html,
      });
    } finally {
      setSending(s => ({ ...s, [i]: false }));
    }
  };

  const body = (v: SlotData | null | undefined) => {
    if (!v) return <div className="empty">Empty</div>;
    const html = v.html ?? (v.lines ? v.lines.join('<br/>') : '');
    return <div className="cell-html" dangerouslySetInnerHTML={{ __html: html }} />;
  };

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
              <button onClick={() => goLive(i)} disabled={sending[i] || !slots[i]}>
                {sending[i] ? 'Sending…' : 'Go Live'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Operator() {
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef  = useRef<HTMLInputElement>(null);
  const [slot, setSlot] = useState(1);

  // Connect + ensure we have an auth user (anonymous is fine)
  useEffect(() => {
    const offConn = subscribeConnected();
    const offAuth = onAuthStateChanged(auth, (u) => {
      if (!u) {
        signInAnonymously(auth)
          .then((cred) => console.info('[auth] signed in anonymously:', cred.user.uid))
          .catch((e) => console.error('[auth] anonymous sign-in failed:', e));
      } else {
        console.info('[auth] uid:', u.uid);
      }
    });
    return () => { offConn(); offAuth(); };
  }, []);

  const exec = (cmd: string, val?: string) => document.execCommand(cmd, false, val);

  const sendToPreview = async () => {
    const html  = editorRef.current?.innerHTML ?? '';
    const title = titleRef.current?.value?.trim() || 'Untitled Slide';
    await setPreviewSlot(slot, { id: String(Date.now()), kind: 'workspace', title, html });
  };

  return (
    <>
      <div className="layout">
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
            <div ref={editorRef} className="editor" contentEditable suppressContentEditableWarning>
              <h1>Good Morning Church</h1>
            </div>
          </div>
        </section>

        <section className="col preview">
          <PreviewGrid />
        </section>

        <section className="col live">
          <div className="panel">
            <div className="panel-title">Live</div>
            <iframe className="live-iframe" src="/live" />
          </div>
        </section>
      </div>

      <div className="bottom">
        <div className="panel"><div className="panel-title">Hymns</div><HymnDisplay /></div>
        <div className="panel"><div className="panel-title">Bible</div><BibleDisplay /></div>
        <div className="panel"><div className="panel-title">Slides</div><SlidesMini /></div>
      </div>

      <style jsx global>{`
        :root{ --fg:#e5e7eb; --dim:#94a3b8; --glass:rgba(255,255,255,.06); }
        html,body {height:100%}
        body{
          margin:0;color:var(--fg);
          background:
            radial-gradient(80rem 80rem at -10% -10%, rgba(130,48,86,.16), transparent 36%),
            radial-gradient(60rem 60rem at 110% -10%, rgba(45,62,158,.22), transparent 42%),
            linear-gradient(135deg,#0b1220,#111a34);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        }
        .layout{ padding:16px 16px 0 16px; display:flex; gap:16px; align-items:stretch; }
        .col{min-width:0; display:flex; flex-direction:column}
        .col.workspace{flex:0 0 45%}
        .col.preview  {flex:0 0 35%}
        .col.live     {flex:0 0 20%}
        .panel{ background:var(--glass); border:1px solid rgba(255,255,255,.08); border-radius:12px; padding:14px;
                backdrop-filter: blur(8px); box-shadow: 0 18px 36px rgba(0,0,0,.35); display:flex; flex-direction:column; min-height:0; }
        .panel-title{font-weight:700;margin-bottom:10px}
        .ws-head{display:flex; gap:10px; align-items:center; margin-bottom:8px}
        .ws-head .title{ flex:1; padding:8px 10px; border-radius:8px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.25); color:var(--fg); }
        .tb{display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px}
        .editor{ flex:1; min-height:0; overflow:auto; padding:14px; border-radius:10px; background: rgba(0,0,0,.35); border:1px solid rgba(255,255,255,.12); }
        .preview-grid{ display:grid; grid-template-columns:1fr 1fr; grid-auto-rows:1fr; gap:12px; flex:1; min-height:0; }
        .preview-cell{ display:grid; grid-template-rows:auto 1fr auto; min-height:0; border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:10px; background:#0b0f19; }
        .cell-head{color:var(--dim); font-size:.9rem; margin-bottom:4px}
        .cell-body{min-height:0; overflow:auto}
        .cell-html{white-space:pre-wrap}
        .cell-actions{display:flex; gap:8px; margin-top:8px}
        .cell-actions button{ background:rgba(255,255,255,.08); color:var(--fg); border:1px solid rgba(255,255,255,.12); padding:6px 8px; border-radius:8px; cursor:pointer; }
        .empty{color:var(--dim)}
        .live-iframe{width:100%;height:60vh;* ⬅ bigger, fills most of the screen height */min-height:420px;/* keeps it usable on small desktops */border:none;  border-radius:12px;  background:#000; }
        .bottom{ display:grid; grid-template-columns: 1fr 1fr 1fr; gap:16px; padding:16px; }
        @media (max-width: 980px){
          .layout{flex-direction:column}
          .col.workspace,.col.preview,.col.live{flex-basis:auto}
          .bottom{grid-template-columns:1fr}
          .live-iframe{aspect-ratio:16/9; height:auto}
        }
      `}</style>
    </>
  );
}

export default dynamic(() => Promise.resolve(Operator), { ssr: false });
