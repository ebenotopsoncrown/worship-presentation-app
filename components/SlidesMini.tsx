import { useRef, useState } from 'react';
import { setPreviewSlot } from '../utils/firebase';

type Slot = 1 | 2 | 3 | 4;

export default function SlidesMini() {
  const [title, setTitle] = useState('Welcome');
  const [text, setText] = useState('Welcome to church!');
  const [slot, setSlot] = useState<Slot>(2);
  const [slidesImgs, setSlidesImgs] = useState<string[]>([]); // data-URLs for imported images
  const [notice, setNotice] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onImportClick = () => fileRef.current?.click();

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setNotice('');
    const f = e.target.files?.[0];
    if (!f) return;

    const name = (f.name || '').toLowerCase();
    const type = f.type || '';

    // Only handle images in-browser. For PPT/PDF, show guidance.
    const isImg = type.startsWith('image/');
    const isPpt = name.endsWith('.ppt') || name.endsWith('.pptx');
    const isPdf = name.endsWith('.pdf');

    if (isImg) {
      const reader = new FileReader();
      reader.onload = () => {
        setSlidesImgs([String(reader.result || '')]);
        setNotice('');
      };
      reader.readAsDataURL(f);
    } else if (isPpt || isPdf) {
      setSlidesImgs([]);
      setNotice('PPT/PDF detected — please export your slides to images (JPG/PNG) and import them here.');
    } else {
      setSlidesImgs([]);
      setNotice('Unsupported file type. Please import JPG/PNG.');
    }

    // reset the input so re-selecting same file triggers onChange
    e.currentTarget.value = '';
  };

  const clearImport = () => {
    setSlidesImgs([]);
    setNotice('');
  };

  const buildHtmlSlides = (): string[] => {
    if (slidesImgs.length) {
      // one slide per imported image
      return slidesImgs.map(
        (src) =>
          `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%">
             <img src="${src}" alt="${title || 'Slide'}" style="max-width:100%;max-height:100%;object-fit:contain"/>
           </div>`
      );
    }
    // text slide (single)
    const body = text.replace(/\n/g, '<br/>');
    return [`<div style="font-size:52px; line-height:1.22">${body}</div>`];
  };

  const send = async () => {
    setBusy(true);
    try {
      const slides = buildHtmlSlides();
      if (slot === 1) {
        // queued
        await setPreviewSlot(1, {
          kind: 'slides',
          slides,
          index: 0,
          meta: { type: 'slide', title },
        });
      } else {
        // non-queued: stack slides vertically in one HTML payload (scrollable in panel)
        const stacked = slides
          .map((s) => `<div style="margin-bottom:12px">${s}</div>`)
          .join('');
        await setPreviewSlot(slot, { html: stacked, meta: { type: 'slide', title } });
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

        <button onClick={onImportClick} className="btn btn-ghost">Import slide (PPT/JPG)</button>
        <input
          ref={fileRef}
          type="file"
          accept=".ppt,.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,image/*,.pdf"
          onChange={onFileChange}
          className="hidden"
        />

        {slidesImgs.length > 0 && (
          <button onClick={clearImport} className="btn btn-ghost">Clear import</button>
        )}

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

      {/* scrolling preview area */}
      <div className="preview-frame">
        {notice && <div className="text-amber-300 text-sm mb-2">{notice}</div>}

        {slidesImgs.length > 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={slidesImgs[0]}
              alt="Imported preview"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
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
