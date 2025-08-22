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

  const clearImport = () => {
    setFile(null); setFilePreviewUrl(null);
  };

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

      // If an image was selected, try to upload to Storage; if not configured, fall back to data URL
      if (file) {
        try {
          const remote = await uploadSlideImage(file);
          const txt = (text ?? '').replace(/\n/g, '<br/>');
          finalHtml =
            `${txt ? `<div style="font-size:52px; line-height:1.22">${txt}</div>` : ''}` +
            `<div style="margin-top:12px"><img src="${remote}" style="max-width:100%;height:auto;border-radius:12px"/></div>`;
        } catch {
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
    <div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Slide title"
          style={{ flex:'1 1 200px', padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.08)', color:'#e5e7eb' }} />
        <span style={{ opacity:.7 }}>Send to</span>
        <select value={slot} onChange={e => setSlot(Number(e.target.value) as Slot)}
          style={{ padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,.08)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,.15)' }}>
          {[1,2,3,4].map(n => <option key={n} value={n}>Preview {n}</option>)}
        </select>
        <button onClick={send} disabled={busy}
          style={{ padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,.08)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,.12)', opacity: busy ? .6 : 1 }}>
          {busy ? 'Sending…' : 'Send to Preview'}
        </button>
      </div>

      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
        <label style={{ display:'inline-block' }}>
          <input type="file" accept="image/*" onChange={onChooseFile} style={{ display:'none' }} />
          <span style={{ padding:'6px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.08)', cursor:'pointer' }}>
            Import slide (image)
          </span>
        </label>
        {file && <button onClick={clearImport} style={{ padding:'6px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.08)' }}>Clear</button>}
      </div>

      {/* Local preview box */}
      <div style={{ width:'100%', minHeight:140, padding:'12px', borderRadius:12, border:'1px solid rgba(255,255,255,.12)', background:'rgba(0,0,0,.35)' }}
           dangerouslySetInnerHTML={{ __html: composeHtml }} />
      
      {/* Optional text content */}
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Add text (optional)"
        style={{ width:'100%', minHeight:120, marginTop:10, padding:'10px', borderRadius:8, border:'1px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.08)', color:'#e5e7eb' }} />
    </div>
  );
}
