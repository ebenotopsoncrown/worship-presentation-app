// scripts/epub-to-hymns.js
// Usage: node scripts/epub-to-hymns.js "C:/Users/YourName/Documents/OPS"
const fs = require('fs/promises');
const path = require('path');
const fg = require('fast-glob');
const cheerio = require('cheerio');

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
const asArr = (v) => (Array.isArray(v) ? v : []);
const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/** Heuristic: detect headers like "123. Title" (or "123 Title") */
function matchHymnHeader(text) {
  const m = clean(text).match(/^(\d{1,4})\s*[.\-–:]?\s*(.+)$/);
  if (!m) return null;
  const number = Number(m[1]);
  const title = clean(m[2]);
  if (!title) return null;
  return { number, title };
}

async function parseHtmlFile(file) {
  const html = await fs.readFile(file, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: true });

  // Collect block-level texts in reading order
  const blocks = [];
  $('h1,h2,h3,h4,p,div,li').each((_, el) => {
    const tag = el.tagName?.toLowerCase?.() || el.name?.toLowerCase?.() || '';
    let text = $(el).text();
    text = clean(text);
    if (text) blocks.push({ tag, text });
  });

  const hymns = [];
  let cur = null;

  const pushCurrent = () => {
    if (!cur) return;
    // finalize
    const verses = cur.verses.filter((v) => v.length);
    const firstLine = verses[0]?.[0] || (cur.chorus?.[0] || cur.title);
    cur.firstLine = firstLine;
    cur.id = `${slug(cur.title)}-${cur.number || Date.now()}`;
    cur.searchTokens = [cur.title, cur.firstLine].filter(Boolean).map((s) => s.toLowerCase());
    hymns.push(cur);
    cur = null;
  };

  for (const b of blocks) {
    // Start a new hymn when we see a header pattern
    const head = matchHymnHeader(b.text);
    if ((b.tag.startsWith('h') || !cur) && head) {
      if (cur) pushCurrent();
      cur = { id: '', number: head.number, title: head.title, verses: [], chorus: undefined };
      continue;
    }
    if (!cur) continue;

    // Chorus / Refrain
    const chorusMatch = b.text.match(/^(chorus|refrain)\b[:\-]?\s*(.*)$/i);
    if (chorusMatch) {
      const rest = clean(chorusMatch[2]);
      const lines = rest ? [rest] : [];
      if (!cur.chorus) cur.chorus = [];
      if (lines.length) cur.chorus.push(...lines);
      continue;
    }

    // Treat each block (<p>, <div>, <li>) as a stanza; split on line breaks if any
    const stanzaLines = clean(b.text)
      .split(/\s*\n+\s*|<br\s*\/?>/i)
      .map((l) => clean(l))
      .filter(Boolean);
    if (stanzaLines.length) cur.verses.push(stanzaLines);
  }
  if (cur) pushCurrent();

  return hymns;
}

async function main() {
  const opsDir = process.argv[2];
  if (!opsDir) {
    console.error('Usage: node scripts/epub-to-hymns.js "C:/path/to/OPS"');
    process.exit(1);
  }
  const abs = path.resolve(opsDir);
  const patterns = [`${abs.replace(/\\/g, '/')}/**/*.xhtml`, `${abs.replace(/\\/g, '/')}/**/*.html`, `${abs.replace(/\\/g, '/')}/**/*.htm`];
  const files = await fg(patterns, { dot: false, caseSensitiveMatch: false });

  if (!files.length) {
    console.error('No .xhtml/.html files found in', abs);
    process.exit(1);
  }
  console.log(`Scanning ${files.length} files…`);

  let all = [];
  for (const f of files.sort()) {
    const items = await parseHtmlFile(f);
    if (items.length) {
      console.log(`  + ${path.basename(f)} → ${items.length} hymns`);
      all = all.concat(items);
    }
  }

  // Deduplicate by (number,title)
  const seen = new Set();
  const unique = [];
  for (const h of all) {
    const key = `${h.number || ''}|${h.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(h);
  }

  // Sort by numeric number (if present), otherwise by title
  unique.sort((a, b) => {
    if (a.number && b.number) return a.number - b.number;
    if (a.number) return -1;
    if (b.number) return 1;
    return a.title.localeCompare(b.title);
  });

  // Write outputs
  await fs.mkdir(path.resolve('data'), { recursive: true });
  const arrOut = { hymns: unique };
  await fs.writeFile(path.resolve('data/mfm_hymns.json'), JSON.stringify(arrOut, null, 2), 'utf8');

  // Map for Firebase import: hymn_library/{id}: {…}
  const map = {};
  for (const h of unique) map[h.id] = h;
  await fs.writeFile(path.resolve('data/hymn_library.json'), JSON.stringify(map, null, 2), 'utf8');

  console.log(`\n✅ Wrote:\n  • data/mfm_hymns.json  (array)\n  • data/hymn_library.json (map for Firebase import)\n  Total hymns: ${unique.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
