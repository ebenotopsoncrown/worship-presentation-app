// pages/tools/hymn-import.tsx
'use client';
import React, { useState } from 'react';
import { auth, onValue, ref, set } from '../../utils/firebase';

type Library = Record<string, {
  id: string;
  number?: number;
  title?: string;
  firstLine?: string;
  verses: string[] | string[][];
  chorus?: string[];
  searchTokens?: string[];
}>;

export default function HymnImport() {
  const [json, setJson] = useState<Library | null>(null);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [msg, setMsg] = useState<string>('');

  React.useEffect(() => {
    const r = ref('hymn_library');
    const off = onValue(r, (snap) => {
      const v = snap.val();
      setCount(v ? Object.keys(v).length : 0);
    });
    return () => off();
  }, []);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const txt = await f.text();
    try {
      const obj = JSON.parse(txt);
      if (!obj || typeof obj !== 'object') throw new Error('Invalid JSON');
      setJson(obj);
      setMsg(`Loaded ${Object.keys(obj).length} hymns from file.`);
    } catch (e: any) {
      setMsg(`Invalid JSON: ${e?.message || e}`);
    }
  };

  const replaceLib = async () => {
    if (!json) { setMsg('Pick a JSON file first.'); return; }
    setBusy(true);
    try {
      await set(ref('hymn_library'), json);
      setMsg(`✅ Replaced hymn_library with ${Object.keys(json).length} hymns.`);
    } catch (e: any) {
      setMsg(`Upload failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 space-y-4">
      <h1 className="text-2xl font-bold">Hymn Library Import</h1>
      <p className="text-sm text-zinc-400">
        Current hymns in DB: <strong>{count ?? '…'}</strong>
      </p>

      <div className="flex items-center gap-3">
        <input type="file" accept="application/json" onChange={onPick}
               className="file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-zinc-800 file:text-white" />
        <button
          onClick={replaceLib}
          disabled={!json || busy}
          className="px-3 py-2 rounded bg-emerald-600 disabled:bg-zinc-700 hover:bg-emerald-500"
        >
          {busy ? 'Uploading…' : 'Replace library'}
        </button>
      </div>

      {msg && <div className="text-sm text-zinc-300">{msg}</div>}

      <div className="mt-6 text-xs text-zinc-500">
        Tip: generate <code>public/data/hymn_library.json</code> with the docx
        ingestor, then upload it here.
      </div>
    </div>
  );
}
