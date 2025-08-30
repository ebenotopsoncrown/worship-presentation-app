import type { NextApiRequest, NextApiResponse } from 'next';

type Verse = { v: number; t: string };

// Minimal, always-available fallback. Replace with a real Bible API if you like.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = String(req.query.q || '').trim();
  const ver = String(req.query.ver || 'KJV');

  if (!q) {
    res.status(400).json({ error: 'Missing q' });
    return;
  }

  // Tiny demo response (John 3:16)
  const verses: Verse[] = [
    { v: 16, t: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' }
  ];

  res.status(200).json({ ref: `${q} (${ver})`, verses });
}
