'use client';
import React, { useMemo, useState } from 'react';
import hymnsData from '../data/mfm_hymns.json';
import { setPreviewSlot } from '../utils/firebase';

type Hymn = {
  id: string;
  number: number;
  title: string;
  firstLine: string;
  verses: string[][];
  chorus?: string[];
  searchTokens: string[];
};

const asArr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const asStr = (v: unknown): string => (typeof v === 'string' ? v : '');

const HYMNS: Hymn[] = asArr<Hymn>((hymnsData as any)?.hymns);

export default function HymnDisplay() {
  const [q, setQ] = useState('');
  const [slot, setSlot] = useState<1 | 2 | 3 | 4>(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = HYMNS;

    if (!s) return base.slice(0, 30);

    if (/^\d+$/.test(s)) {
      return base.filter((h) => String(h.number).startsWith(s)).slice(0, 50);
    }

    return base
      .filter((h) => {
        const title = asStr(h.title).toLowerCase();
        const first = asStr(h.firstLine).toLowerCase();
        const tokens = asArr<string>(h.searchTokens);
        return (
          title.includes(s) ||
          first.includes(s) ||
          tokens.some((t) => asStr(t).toLowerCase().startsWith(s))
        );
      })
      .slice(0, 50);
  }, [q]);

  function renderPreviewHtml(h: Hymn) {
    const verses = asArr<string[]>(h.verses).map((v) => asArr<string>(v));
    const chorus = asArr<string>(h.chorus);
    const blocks: string[] = [];
    blocks.push(
      `<h2 style="margin:0 0 .25em 0">${escapeHtml(`${h.title}`)}</h2>`
    );
    verses.forEach((v) => {
      blocks.push(`<p>${v.map((l) => escapeHtml(l)).join('<br/>')}</p>`);
    });
    if (chorus.length) {
      blocks.push(
        `<p><em>${chorus.map((l) => escapeHtml(l)).join('<br/>')}</em></p>`
      );
    }
    return blocks.join('');
  }

  async function send(h: Hymn) {
    try {
      setBusyId(h.id);
      const html = renderPreviewHtml(h);
      await setPreviewSlot(slot, {
        id: String(Date.now()),
        kind: 'hymn',
        title: `${h.number}. ${h.title}`,
        html,
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <div className="panel-title">Hymns</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          placeholder="Search by number, title, or first line…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,.12)',
            background: 'rgba(0,0,0,.25)',
            color: 'inherit',
          }}
        />
        <select
          value={slot}
          onChange={(e) => setSlot(Number(e.target.value) as 1 | 2 | 3 | 4)}
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              Preview {n}
            </option>
          ))}
        </select>
      </div>

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gap: 8,
        }}
      >
        {results.map((h) => (
          <li
            key={h.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 8,
              background: 'rgba(0,0,0,.25)',
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>
                {h.number}. {h.title}
              </div>
              <div style={{ opacity: 0.65, fontSize: '.9rem' }}>
                {h.firstLine}
              </div>
            </div>
            <button
              onClick={() => send(h)}
              disabled={busyId === h.id}
              style={{ padding: '6px 10px', opacity: busyId === h.id ? 0.6 : 1 }}
            >
              {busyId === h.id ? 'Sending…' : 'Send to Preview'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!)
  );
}
