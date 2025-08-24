// pages/tools/hymn-text-import.tsx
'use client';
import React from 'react';
import { ref, onValue, set } from '../../utils/firebase';

type Hymn = {
  id: string;
  number?: number;
  title: string;
  firstLine: string;
  verses: string[][];
  chorus?: string[];
  searchTokens?: string[];
};
type Library = Record<string, Hymn>;

function slug(s: string) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
function tokenise(s: string) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}
function looksLikeTitle(line: string) {
  const t = line.trim();
  if (!t) return false;
  if (/^chorus\b/i.test(t)) return false;
  const words = t.split(/\s+/);
  const longWords = words.filter((w) => w.length >= 3).length;
  const punct = /[.:,;!?]/.test(t);
  const titleCaseish = words.filter((w) => /^[A-Z]/.test(w)).length >= Math.ceil(words.length * 0.6);
  return longWords >= 2 && !punct && titleCaseish;
}

export default function HymnTextImport() {
  const [count, setCount] = React.useState<number | null>(null);
  const [msg, setMsg] = React.useState<string>('');
  const [busy, setBusy] = React.useState(false);
  const [preview, setPreview] = React.useState<Library | null>(null);

  React.useEffect(() => {
    const off = onValue(ref('hymn_library'), (snap) => {
      const v = snap.val();
      setCount(v ? Object.keys(v).length : 0);
    });
    return () => off();
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    const lib = parseTextToLibrary(text);
    setPreview(lib);
    setMsg(`Parsed ${Object.keys(lib).length} hymns from text. Click "Replace library" to upload.`);
  };

  const upload = async () => {
    if (!preview) { setMsg('Pick a .txt file first.'); return; }
    setBusy(true);
    try {
      await set(ref('hymn_library'), preview);
      setMsg(`✅ Replaced hymn_library with ${Object.keys(preview).length} hymns.`);
    } catch (e: any) {
      setMsg(`Upload failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 space-y-4">
      <h1 className="text-2xl font-bold">Hymn Import (TXT, no Node required)</h1>
      <p className="text-sm text-zinc-400">
        Current hymns in DB: <strong>{count ?? '…'}</strong>
      </p>

      <div className="flex items-center gap-3">
        <input
          type="file"
          accept=".txt,text/plain"
          onChange={handleFile}
          className="file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-zinc-800 file:text-white"
        />
        <button
          onClick={upload}
          disabled={!preview || busy}
          className="px-3 py-2 rounded bg-emerald-600 disabled:bg-zinc-700 hover:bg-emerald-500"
        >
          {busy ? 'Uploading…' : 'Replace library'}
        </button>
      </div>

      {msg && <div className="text-sm text-zinc-300">{msg}</div>}

      {preview && (
        <div className="mt-6 text-xs text-zinc-400 max-h-64 overflow-auto border border-zinc-800 rounded p-3">
          <strong>Preview (first 5):</strong>
          <ul className="list-disc ml-5">
            {Object.values(preview).slice(0, 5).map(h => (
              <li key={h.id}>{h.number}. {h.title} — <em>{h.firstLine}</em></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function parseTextToLibrary(txt: string): Library {
  const lines = txt.replace(/\r\n/g, '\n').split('\n').map(l => l.trimRight());

  const hymns: Hymn[] = [];
  let cur: Hymn | null = null;
  let stanza: string[] = [];

  function pushStanza() {
    const joined = stanza.join(' ').trim();
    stanza = [];
    if (!joined || !cur) return;
    if (/^chorus\b/i.test(joined)) {
      const rest = joined.replace(/^chorus\b[:\-]?\s*/i, '').trim();
      cur.chorus = cur.chorus || [];
      if (rest) cur.chorus.push(rest);
      return;
    }
    cur.verses.push(joined.split(/\s{2,}/).filter(Boolean));
  }
  function startNew(title: string) {
    if (cur) {
      pushStanza();
      finalize(cur);
      hymns.push(cur);
    }
    cur = {
      id: '',
      title: title.trim(),
      verses: [],
      firstLine: ''
    };
  }
  function finalize(h: Hymn) {
    const first = h.verses[0]?.[0] ?? '';
    h.firstLine = String(first).trim();
    const base = h.number ? `${h.number}-${h.title}` : h.title;
    h.id = slug(base || `hymn-${hymns.length + 1}`);
    h.searchTokens = Array.from(new Set([
      ...tokenise(h.title),
      ...tokenise(h.firstLine),
      ...(h.number ? [String(h.number)] : [])
    ]));
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    // Title?
    if (line && looksLikeTitle(line)) {
      startNew(line);
      i++; continue;
    }
    if (cur) {
      if (line === '') {
        pushStanza();
      } else {
        stanza.push(line);
      }
    }
    i++;
  }
  if (cur) {
    pushStanza();
    finalize(cur);
    hymns.push(cur);
  }
  let auto = 1;
  hymns.forEach(h => { if (h.number == null) h.number = auto++; });

  const out: Library = {};
  hymns.forEach(h => { out[h.id] = h; });
  return out;
}
