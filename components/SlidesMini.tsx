import { useRef, useState } from 'react';
import { setPreviewSlot } from '../utils/firebase';

type Slot = 1 | 2 | 3 | 4;

export default function SlidesMini() {
  const [title, setTitle] = useState('Welcome');
  const [text, setText] = useState('Welcome to church!');
  const [slot, setSlot] = useState<Slot>(2);
  const [imgDataUrl, setImgDataUrl] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onImportClick = () => fileRef.current?.click();

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImgDataUrl(String(reader.result || ''));
    reader.readAsDataURL(f);
  };

  const buildHtml = () => {
    if (imgDataUrl) {
      return `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%">
        <img src="${imgDataUrl}" alt="${title || 'Slide'}" style="max-width:100%;max-height:100%;object-fit:contain"/>
      </div>`;
    }
    const body = text.replace(/\n/g, '<br/>');
    return `<div style="font-size:52px; line-height:1.22">${body}</div>`;
  };

  const send = async () => {
    setBusy(true);
    try {
      const html = buildHtml();
      if (slot === 1) {
        await setPreviewSlot(1, {
          kind: 'slides',
          slides: [html],
          index: 0,
          meta: { type: 'slide', title },
        });
      } else {
        await setPreviewSlot(slot, { html, meta: { type: 'slide', title } });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel panel--slides">
      <div className="panel-header">Slides</div>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Slide title"
          className="field min-w-[220px] flex-1"
        />

        <button onClick={onImportClick} className="btn btn-ghost">Import slide (image)</button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />

        <span className="opacity-70">Send to</span>
        <select value={slot} onChange={(e) => setSlot(Number(e.target.value) as Slot)} className="select">
          <option value={1}>Preview 1</option>
          <option value={2}>Preview 2</option>
          <option value={3}>Preview 3</option>
          <option value={4}>Preview 4</option>
        </select>

        <button onClick={send} className="btn btn-green" disabled={busy}>
          {busy ? 'Sending…' : 'Send to Preview'}
        </button>
      </div>

      {/* scrolling preview area: shows image preview when selected; otherwise text editor */}
      <div className="preview-frame">
        {imgDataUrl ? (
          <div className="w-full h-full flex items-center justify-center">
            <img src={imgDataUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-full bg-transparent outline-none resize-none"
          />
        )}
      </div>
    </div>
  );
}
