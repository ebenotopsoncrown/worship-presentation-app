'use client';
import { useCallback, useMemo, useState } from 'react';
import { setPreviewSlot, uploadSlideImage } from '../utils/firebase';

type Slot = 1 | 2 | 3 | 4;

export default function SlidesMini() {
  const [title, setTitle] = useState('Welcome');
  const [text, setText]   = useState('Welcome to church!');
  const [slot, setSlot]   = useState<Slot>(1);
  const [busy, setBusy]   = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const onChooseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setFilePreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const clearImport = () => { setFile(null); setFilePreviewUrl(null); };

  const composeHtml = useMemo(() => {
    const txt = (text ?? '').replace(/\n/g, '<br/>');
    const textBlock = txt ? `<div style="font-size:52px; line-height:1.22">${txt}</div>` : '';
    const imgBlock  = filePreviewUrl ? `<div style="margin-top:12px"><img src="${filePreviewUrl}" style="max-width:100%;height:auto;border-radius:12px"/></div>` : '';
    return `${textBlock}${imgBlock}` || '<div style="opacity:.6">Nothing to preview yet…</div>';
  }, [text, filePreviewUrl]);

  const fileToDataUrl = useCallback((f: File) =>
    new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f); })
  , []);

  const send = async () => {
    if (busy) return;
    setBusy(true);
    try {
      let finalHtml = composeHtml;

      if (file) {
        try {
          // Prefer remote upload if Storage is configured
          const remote = await uploadSlideImage(file);
          const txt = (text ?? '').replace(/\n/g, '<br/>');
          finalHtml =
            `${txt ? `<div style="font-size:52px; line-height:1.22">${txt}</div>` : ''}` +
            `<div style="margin-top:12px"><img src="${remote}" style="max-width:100%;height:auto;border-radius:12px"/></div>`;
        } catch {
          // Fall back to embedded data URL (keeps feature usable without Storage)
          const data = await fileToDataUrl(file);
          const txt = (text ?? '').replace(/\n/g, '<br/>');
          finalHtml =
            `${txt ? `<div style="font-size:52px; line-height:1.22">${txt}</div>` : ''}` +
            `<div style="margin-top:12px"><img src="${data}" style="max-width:100%;height:auto;border-radius:12px"/></div>`;
        }
      }

      await setPreviewSlot(slot, {
        id: `slides-${Date.now()}`,
        kind: 'slides',
        title: title ?? '',
        html: finalHtml,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel panel--slides h-[520px] flex flex-col">
      <div className="panel-header">Slides</div>

      {/* controls */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
        <input
          value={title}
          onChange={e=>setTitle(e.target.value)}
          placeholder="Slide title"
          style={{flex:'1 1 200px', padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,.12)', background:'rgba(0,0,0,.25)', color:'#e5e7eb'}}
        />

        <input type="file" accept="image/*" onChange={onChooseFile}
          style={{padding:'6px 10px', borderRadius:8, background:'rgba(0,0,0,.25)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,.12)'}} />

        {file && (
          <button onClick={clearImport}
            style={{padding:'6px 10px', borderRadius:8, background:'rgba(0,0,0,.25)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,.12)'}}>
            Remove image
          </button>
        )}

        <span style={{opacity:.7}}>Send to</span>
        <select
          value={slot}
          onChange={e=>setSlot(Number(e.target.value) as Slot)}
          style={{padding:'6px 10px', borderRadius:8, background:'rgba(0,0,0,.25)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,.12)'}}
        >
          <option value={1}>Preview 1</option>
          <option value={2}>Preview 2</option>
          <option value={3}>Preview 3</option>
          <option value={4}>Preview 4</option>
        </select>

        <button onClick={send} disabled={busy}
          style={{padding:'6px 10px', borderRadius:8, background:'rgba(0,0,0,.25)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,.12)'}}>
          {busy ? 'Sending…' : 'Send to Preview'}
        </button>
      </div>

      {/* editor + live preview area (fills the remaining height) */}
      <div className="flex-1 min-h-0">
        <div className="bg-black/40 rounded-xl h-full overflow-auto p-4">
          <div
            className="w-full text-center text-zinc-50 text-3xl md:text-4xl leading-tight"
            dangerouslySetInnerHTML={{ __html: composeHtml }}
          />
        </div>
      </div>
    </div>
  );
}
