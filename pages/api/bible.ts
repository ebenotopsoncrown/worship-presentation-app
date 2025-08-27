// pages/api/bible.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type ResBody = { title: string; lines: string[] } | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResBody>) {
  const ref = (req.query.q as string || '').trim();
  const v = ((req.query.v as string) || 'KJV').toUpperCase();

  if (!ref) {
    res.status(400).json({ error: 'Missing q (Bible reference)' });
    return;
  }

  try {
    // bible-api.com supports ?translation=kjv
    const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`;
    const r = await fetch(url, { headers: { accept: 'application/json' } });
    if (!r.ok) throw new Error(`bible-api.com ${r.status}`);
    const data = await r.json() as any;

    const title: string = data.reference || `${ref} (${v})`;
    const lines: string[] = Array.isArray(data?.verses)
      ? data.verses.map((x: any) =>
          `${x.book_name} ${x.chapter}:${x.verse} ${String(x.text || '').trim()}`
        )
      : (data?.text ? [String(data.text)] : [`[No verses returned] ${ref} (${v})`]);

    // cache for an hour at the edge
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ title, lines });
  } catch (e) {
    // graceful fallback so UI still works
    res.status(200).json({
      title: `${ref} (${v})`,
      lines: [`[Bible API unavailable] ${ref} (${v})`],
    });
  }
}
