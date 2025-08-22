'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { db, dbRef, set, onValue, update } from '../utils/firebase';

type Hymn = {
  id: string;
  number?: number;
  title: string;
  firstLine: string;
  verses: string[][];
  chorus?: string[];
  searchTokens?: string[];
};

declare global {
  interface Window {
    mammoth?: any;
    pdfjsLib?: any;
  }
}

const asArr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const asStr = (v: unknown): string => (typeof v === 'string' ? v : '');
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function parseHymnFromText(title: string, raw: string): Hymn {
  const blocks = String(raw).replace(/\r/g, '').trim().split(/\n{2,}/); // blank line separates stanzas
  const verses: string[][] = [];
  let chorus: string[] | undefined;

  for (const b of blocks) {
    const lines = b.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const isChorus = /^chorus[:\-]?/i.test(lines[0]) || /^refrain[:\-]?/i.test(lines[0]);
    if (isChorus) {
      const rest = lines.slice(1).length ? lines.slice(1) : lines;
      chorus = rest;
    } else {
      verses.push(lines);
    }
  }

  const firstLine = verses[0]?.[0] || chorus?.[0] || title;
  return {
    id: `${slug(title)}-${Date.now()}`,
    title,
    firstLine,
    verses,
    chorus,
    searchTokens: [title, firstLine].filter(Boolean).map((s) => s.toLowerCase()),
  };
}

/** Load an external script exactly once */
function loadScriptOnce(srcs: string[], globalKey: 'mammoth' | 'pdfjsLib'): Promise<any> {
  return new Promise(async (resolve, reject) => {
    // already loaded?
    if ((window as any)[globalKey]) return resolve((window as any)[globalKey]);

    const trySrc = async (src: string) =>
      new Promise<void>((res, rej) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.crossOrigin = 'anonymous';
        s.onload = () => res();
        s.onerror = () => rej(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
      });

    for (const src of srcs) {
      try {
        await trySrc(src);
        if ((window as any)[globalKey]) return resolve((window as any)[globalKey]);
      } catch {
        // try next cdn
      }
    }
    reject(new Error(`Could not load ${globalKey} from any CDN`));
  });
}

async function extractTextFromDocx(file: File): Promise<string> {
  // Load mammoth at runtime from a CDN (no compile-time dependency)
  const mammoth: any = await loadScriptOnce(
    [
      'https://unpkg.com/mammoth@1.6.0/mammoth.browser.min.js',
      'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js',
      'https://unpkg.com/mammoth@1.6.0/mammoth.browser.js'
    ],
    'mammoth'
  ).catch(() => null);

  if (!mammoth) throw new Error('mammoth-not-available');

  const ab = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: ab });
  return String(value || '').trim();
}

async function extractTextFromPdf(file: File): Promise<string> {
  // Load pdf.js from a CDN (no compile-time dependency)
  const ver = '3.11.174';
  const pdfjsLib: any = await loadScriptOnce(
    [
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${ver}/build/pdf.min.js`,
      `https://unpkg.com/pdfjs-dist@${ver}/build/pdf.min.js`
    ],
    'pdfjsLib'
  ).catch(() => null);

  if (!pdfjsLib) throw new Error('pdfjs-not-available');

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${ver}/build/pdf.worker.min.js`;

  const ab = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: ab });
  const pdf = await loadingTask.promise;

  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((it: any) => asStr(it.str)).join(' ');
    text += pageText + '\n\n';
  }
  return text.trim();
}

export default function HymnDisplay() {
  const [remote, setRemote] = useState<Hymn[]>([]);
  const [local, setLocal] = useState<Hymn[]>([]); // optional JSON fallback
  const [q, setQ] = useState('');
  const [slot, setSlot] = useState<1 | 2 | 3 | 4>(1);
  const [selected, setSelected] = useState<Hymn | null>(null);
  const [busy, setBusy] = useState(false);

  // Subscribe to RTDB hymn library
  useEffect(() => {
    const ref = dbRef(db, 'hymn_library');
    const off = onValue(ref, (snap) => {
      const val = snap.val() || {};
      const rows: Hymn[] = Object.values(val);
      setRemote(rows);
      if (!selected && rows.length) setSelected(rows[0]);
    });
    return () => off();
  }, [selected]);

  // Load optional bundled JSON as fallback (if present)
  useEffect(() => {
    (async () => {
      try {
        const mod: any = await import('../data/mfm_hymns.json'); // optional
        const raw = mod?.default ?? mod;
        const list = (Array.isArray(raw) ? raw : asArr<Hymn>(raw?.hymns)).map((h: any) => ({
          ...h,
          id: h.id || `${slug(h.title || 'hymn')}-${h.number ?? ''}-${Math.random().toString(36).slice(2, 6)}`
        }));
        setLocal(list);
        if (!selected && !remote.length && list.length) setSelected(list[0]);
      } catch {
        // ignore if the file doesn't exist
      }
    })();
  }, [remote.length, selected]);

  const library = useMemo(() => {
    // prefer remote; include local items that aren't in remote
    const byId = new Map<string, Hymn>();
    for (const h of remote) byId.set(h.id, h);
    for (const h of local) if (!byId.has(h.id)) byId.set(h.id, h);
    return Array.from(byId.values());
  }, [remote, local]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return library.slice(0, 60);
    if (/^\d+$/.test(s)) return library.filter(h => String(h.number ?? '').startsWith(s)).slice(0, 80);
    return library
      .filter(h => {
        const title = asStr(h.title).toLowerCase();
        const first  = asStr(h.firstLine).toLowerCase();
        const tokens = asArr<string>(h.searchTokens ?? []);
        return title.includes(s) || first.includes(s) || tokens.some(t => asStr(t).toLowerCase().startsWith(s));
      })
      .slice(0, 80);
  }, [q, library]);

  const previewHtml = useMemo(() => {
    if (!selected) return '<div style="opacity:.6">Select or add a hymn to preview…</div>';
    const verses = asArr<string[]>(selected.verses).map(v => asArr<string>(v));
    const chorus = asArr<string>(selected.chorus);
    const blocks: string[] = [];
    blocks.push(`<h2 style="margin:0 0 .25em 0">${escapeHtml(selected.title)}</h2>`);
    verses.forEach(v => blocks.push(`<p>${v.map(l => escapeHtml(l)).join('<br/>')}</p>`));
    if (chorus.length) blocks.push(`<p><em>${chorus.map(l => escapeHtml(l)).join('<br/>')}</em></p>`);
    return blocks.join('');
  }, [selected]);

  const send = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await set(dbRef(db, `preview_slots/slot${slot}`), {
        id: String(Date.now()),
        kind: 'hymn',
        title: `${selected.number ? selected.number + '. ' : ''}${selected.title}`,
        html: previewHtml,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <div className="panel-title">Hymns</div>

      {/* Search + controls */}
      <div style={{ display:'flex', gap:8, marginBottom:10, alignItems:'center' }}>
        <input
          placeholder="Search by number, title, or first line…"
          value={q} onChange={(e) => setQ(e.target.value)}
          style={{ flex:1, padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,.12)', background:'rgba(0,0,0,.25)', color:'inherit' }}
        />
        <select value={slot} onChange={e => setSlot(Number(e.target.value) as 1|2|3|4)}>
          {[1,2,3,4].map(n => <option key={n} value={n}>Preview {n}</option>)}
        </select>
        <button onClick={send} disabled={!selected || busy}
          style={{ padding:'6px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.08)', opacity: (!selected || busy) ? .6 : 1 }}>
          {busy ? 'Sending…' : 'Send to Preview'}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {/* Library list */}
        <div style={{ maxHeight:260, overflow:'auto', border:'1px solid rgba(255,255,255,.12)', borderRadius:10, padding:8, background:'rgba(0,0,0,.25)' }}>
          {library.length === 0 ? (
            <div style={{ opacity:.7 }}>No hymns yet — add one below.</div>
          ) : results.length === 0 ? (
            <div style={{ opacity:.7 }}>No hymns match “{q}”.</div>
          ) : (
            <ul style={{ listStyle:'none', padding:0, margin:0 }}>
              {results.map(h => (
                <li key={h.id} onClick={() => setSelected(h)}
                    style={{ padding:'6px 8px', borderRadius:8, cursor:'pointer',
                             background: selected?.id === h.id ? 'rgba(255,255,255,.12)' : 'transparent' }}>
                  <div style={{ fontWeight:600 }}>{h.number ? `${h.number}. ` : ''}{h.title}</div>
                  <div style={{ opacity:.65, fontSize:'.9rem' }}>{h.firstLine}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Preview box */}
        <div style={{ minHeight:260, border:'1px solid rgba(255,255,255,.12)', borderRadius:10, padding:12, background:'rgba(0,0,0,.35)' }}
             dangerouslySetInnerHTML={{ __html: previewHtml }} />
      </div>

      {/* Add hymn (docx/pdf/text) */}
      <details style={{ marginTop:12 }}>
        <summary style={{ cursor:'pointer', opacity:.9 }}>Add hymn (DOCX, PDF, or paste text)</summary>
        <AddHymnForm onSaved={(h) => { setSelected(h); setRemote(prev => [h, ...prev]); }} />
      </details>
    </div>
  );
}

function AddHymnForm({ onSaved }: { onSaved: (h: Hymn) => void }) {
  const [title, setTitle] = useState('');
  const [number, setNumber] = useState<string>('');
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);

  const onFile = async (f: File) => {
    try {
      if (f.name.toLowerCase().endsWith('.docx')) {
        try {
          const text = await extractTextFromDocx(f);
          setRaw(text);
          if (!title) setTitle(f.name.replace(/\.docx$/i, ''));
        } catch {
          alert('DOCX support not available in this environment. Please open the file and paste the text here.');
        }
      } else if (f.name.toLowerCase().endsWith('.pdf')) {
        try {
          const text = await extractTextFromPdf(f);
          setRaw(text);
          if (!title) setTitle(f.name.replace(/\.pdf$/i, ''));
        } catch {
          alert('PDF support not available in this environment. Please copy the text and paste it here.');
        }
      } else {
        // Plain text
        const txt = await f.text();
        setRaw(txt);
        if (!title) setTitle(f.name);
      }
    } catch (e) {
      console.error('Failed to import file', e);
      alert('Could not read the file. Try a different format or paste the text.');
    }
  };

  const save = async () => {
    if (!title.trim() || !raw.trim()) {
      alert('Please provide a title and some hymn text.');
      return;
    }
    setBusy(true);
    try {
      const hymn = parseHymnFromText(title.trim(), raw.trim());
      if (number.trim() && /^\d+$/.test(number.trim())) hymn.number = Number(number.trim());
      await update(dbRef(db, `hymn_library/${hymn.id}`), hymn);
      onSaved(hymn);
      setTitle(''); setNumber(''); setRaw('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop:10, border:'1px dashed rgba(255,255,255,.25)', borderRadius:10, padding:10 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title"
          style={{ flex:'1 1 240px', padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,.12)', background:'rgba(0,0,0,.25)', color:'inherit' }} />
        <input value={number} onChange={e=>setNumber(e.target.value)} placeholder="Number (optional, digits only)"
          style={{ width:220, padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,.12)', background:'rgba(0,0,0,.25)', color:'inherit' }} />
        <label style={{ display:'inline-block' }}>
          <input type="file" accept=".doc,.docx,.pdf,.txt" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} style={{ display:'none' }} />
          <span style={{ padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.08)', cursor:'pointer' }}>
            Import file
          </span>
        </label>
        <button onClick={save} disabled={busy}
          style={{ padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.08)', opacity: busy ? .6 : 1 }}>
          {busy ? 'Saving…' : 'Save to Library'}
        </button>
      </div>
      <textarea value={raw} onChange={e=>setRaw(e.target.value)} placeholder={`Paste hymn text here.\n• Separate stanzas with a blank line\n• Start a chorus stanza with "Chorus:" or "Refrain:"`}
        style={{ width:'100%', minHeight:160, padding:'10px', borderRadius:8, border:'1px solid rgba(255,255,255,.12)', background:'rgba(0,0,0,.25)', color:'inherit' }} />
      <div style={{ opacity:.65, fontSize:'.9rem', marginTop:8 }}>
        Tip: Title on the first line. Each stanza separated by a blank line. Use “Chorus:” to mark the chorus.
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}
