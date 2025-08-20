// pages/api/bible.ts
import type { NextApiRequest, NextApiResponse } from 'next'

type Verse = { n: string; t: string }
type Payload = {
  version: string
  query: string
  verses: Verse[]
  slides: Verse[][]
}

// very small in-memory cache (survives per Vercel lambda warm cycle)
const mem = new Map<string, Payload>()

function chunkVerses(verses: Verse[], per = 2): Verse[][] {
  const out: Verse[][] = []
  for (let i = 0; i < verses.length; i += per) out.push(verses.slice(i, i + per))
  return out
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const q = String(req.query.q || '').trim()
    const version = String(req.query.version || 'KJV').toUpperCase()

    if (!q) return res.status(400).json({ error: 'Missing q' })
    const key = `${version}:${q}`
    if (mem.has(key)) return res.status(200).json(mem.get(key))

    // ---- KJV (no key, proxied) ----
    if (version === 'KJV') {
      // bible-api.com supports "John 3:16-18?translation=kjv"
      const url = `https://bible-api.com/${encodeURIComponent(q)}?translation=kjv`
      const r = await fetch(url)
      if (!r.ok) throw new Error(`KJV provider error ${r.status}`)
      const j = await r.json() as any

      const verses: Verse[] =
        (j.verses || []).map((v: any) => ({ n: String(v.verse), t: String(v.text || '').trim() }))

      const slides = chunkVerses(verses, 2) // pair verses by default
      const payload: Payload = { version: 'KJV', query: q, verses, slides }
      mem.set(key, payload)
      return res.status(200).json(payload)
    }

    // ---- keep your existing branches for NKJV / RSV / ESV here ----
    // Example shape (pseudo-code):
    // if (version === 'ESV') { ...fetch with your key... return res.json(payload) }

    return res.status(400).json({ error: `Unsupported version "${version}"` })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' })
  }
}
