// pages/api/bible.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = (req.query.q ?? '').toString().trim();
  const ver = ((req.query.ver ?? 'kjv') as string).toLowerCase();

  if (!q) return res.status(400).json({ error: 'Missing q (Bible reference)' });

  try {
    // Example public API; keep your existing source if you already have one
    const url = `https://bible-api.com/${encodeURIComponent(q)}?translation=${encodeURIComponent(ver)}`;
    const r = await fetch(url);
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      return res.status(r.status).send(txt || 'Failed to fetch verses');
    }

    const data = await r.json();
    const ref = data?.reference || q;
    const verses = (data?.verses ?? []).map((v: any) => ({ v: v?.verse, t: (v?.text ?? '').trim() }));

    return res.status(200).json({ ref, verses });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Bible fetch failed' });
  }
}
