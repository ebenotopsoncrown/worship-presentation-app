// pages/api/bible.ts
import type { NextApiRequest, NextApiResponse } from "next";

type Verse = { v: number; t: string };
type Ok = { ref: string; verses: Verse[] };
type Err = { error: string };

// Map common inputs to bible-api.com's supported translations.
// (bible-api.com supports: kjv, web, asv, ylt, darby, wbt, douay-rheims)
const VERSION_MAP: Record<string, string> = {
  kjv: "kjv",
  web: "web",
  asv: "asv",
  ylt: "ylt",
  darby: "darby",
  wbt: "wbt",
  "douay-rheims": "douay-rheims",
  // Friendly aliases
  "king james version": "kjv",
  nkjv: "kjv", // we fallback to KJV if NKJV is chosen
  niv: "kjv",  // NIV/ESV require other providers; map to KJV for now
  esv: "kjv",
};

function normaliseVersion(ver?: string) {
  const key = (ver ?? "").toString().trim().toLowerCase();
  return VERSION_MAP[key] || "kjv";
}

// lib/bible.ts
export async function fetchVerses(ref: string, version: string) {
  const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=${version.toLowerCase()}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Bible API ${r.status}`);
  const data = await r.json() as any;
  // bible-api returns `text` (string) or `verses` (array)
  return (data.text?.trim()) ||
         (Array.isArray(data.verses) ? data.verses.map((v: any) => v.text).join('\n').trim() : '');
}

  const q = (req.query.q ?? "").toString().trim().replace(/\s+/g, " ");
  const ver = normaliseVersion((req.query.ver ?? "").toString());

  if (!q) {
    return res.status(400).json({ error: "Missing q (Bible reference)" });
  }

  try {
    const url = `https://bible-api.com/${encodeURIComponent(
      q
    )}?translation=${encodeURIComponent(ver)}`;

    const r = await fetch(url, { headers: { accept: "application/json" } });
    const txt = await r.text();

    if (!r.ok) {
      // Bubble up any message the upstream API returned
      try {
        const j = JSON.parse(txt);
        return res.status(r.status).json({ error: j?.error || txt || "Failed to fetch verses" });
      } catch {
        return res.status(r.status).json({ error: txt || "Failed to fetch verses" });
      }
    }

    const data = JSON.parse(txt);
    const ref: string = data?.reference || q;

    const verses: Verse[] = Array.isArray(data?.verses)
      ? data.verses
          .map((v: any) => ({
            v: typeof v?.verse === "number" ? v.verse : Number(v?.verse) || 0,
            t: (v?.text ?? "").toString().trim(),
          }))
          .filter((v: Verse) => v.t.length)
      : [];

    return res.status(200).json({ ref, verses });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Bible fetch failed" });
  }
}

