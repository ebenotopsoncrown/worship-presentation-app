// components/BibleDisplay.tsx
import React, { useState } from 'react'
import { db, dbRef, set } from '../utils/firebase'

export default function BibleDisplay() {
  const [input, setInput] = useState('John 3:16-18')
  const [version, setVersion] = useState('kjv')
  const [slot, setSlot] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchAndPreview = async () => {
    try {
      setLoading(true)
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(input)}?translation=${encodeURIComponent(version)}`)
      const data = await res.json()
      // Some APIs return {verses:[{text}]} and some return {text}
      let lines: string[] = []
      if (Array.isArray(data?.verses)) {
        lines = data.verses.map((v: any) => `<p>${escapeHtml(v.text)}</p>`)
      } else if (typeof data?.text === 'string') {
        lines = data.text.split(/\r?\n/).filter(Boolean).map((t: string) => `<p>${escapeHtml(t)}</p>`)
      } else {
        lines = [`<p>${escapeHtml(String(data || 'No result'))}</p>`]
      }
      await set(dbRef(db, `preview_board/${slot}`), lines)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-x-2">
      <input value={input} onChange={e => setInput(e.target.value)} className="border rounded px-2 py-1" />
      <select value={version} onChange={e => setVersion(e.target.value)} className="border rounded px-2 py-1">
        <option value="kjv">KJV</option>
        <option value="asv">ASV</option>
        <option value="web">WEB</option>
        <option value="nkjv">NKJV</option>
      </select>
      <select value={slot} onChange={e => setSlot(parseInt(e.target.value,10))} className="border rounded px-2 py-1">
        <option value={0}>Preview 1</option><option value={1}>Preview 2</option><option value={2}>Preview 3</option><option value={3}>Preview 4</option>
      </select>
      <button onClick={fetchAndPreview} className="px-3 py-1 rounded bg-sky-600 text-white" disabled={loading}>
        {loading ? 'Sending…' : 'Send to Preview'}
      </button>
    </div>
  )
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m] as string))
}
