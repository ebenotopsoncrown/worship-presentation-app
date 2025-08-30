// components/ThemeSettings.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { db, ref as dbRef, onValue, set } from '../utils/firebase';

/** ---- Types ------------------------------------------------------------ */

type Presentation = {
  /** How many verses appear on one slide */
  versesPerSlide: number;
};

type Theme = {
  /** Base font size for slides (px) */
  fontSize: number;
  /** Optional extras—add more as your UI grows */
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  lineHeight?: number;
};

/** ---- Defaults --------------------------------------------------------- */

const DEFAULT_PRESENTATION: Presentation = {
  versesPerSlide: 2,
};

const DEFAULT_THEME: Theme = {
  fontSize: 64,
  fontFamily: 'Inter',
  bold: false,
  italic: false,
  lineHeight: 1.15,
};

/** ---- Component -------------------------------------------------------- */

export default function ThemeSettings() {
  const [presentation, setPresentation] = useState<Presentation>(DEFAULT_PRESENTATION);
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);

  /** Live subscribe to current settings */
  useEffect(() => {
    const off1 = onValue(dbRef(db, 'presentation'), (snap) => {
      const val = snap.val() as Presentation | null;
      if (val && typeof val.versesPerSlide === 'number') {
        setPresentation({ versesPerSlide: Math.max(1, Math.floor(val.versesPerSlide)) });
      } else {
        setPresentation(DEFAULT_PRESENTATION);
      }
    });

    const off2 = onValue(dbRef(db, 'theme'), (snap) => {
      const val = snap.val() as Theme | null;
      setTheme({ ...DEFAULT_THEME, ...(val ?? {}) });
      setLoading(false);
    });

    return () => {
      // both onValue calls return an unsubscribe function in the utils layer
      // If your utils return void, you can ignore these.
      try { typeof off1 === 'function' && off1(); } catch {}
      try { typeof off2 === 'function' && off2(); } catch {}
    };
  }, []);

  /** Persist helpers (write-through updates) */
  const patchPresentation = (patch: Partial<Presentation>) => {
    setPresentation((prev) => {
      const next = { ...prev, ...patch };
      set(dbRef(db, 'presentation'), next);
      return next;
    });
  };

  const patchTheme = (patch: Partial<Theme>) => {
    setTheme((prev) => {
      const next = { ...prev, ...patch };
      set(dbRef(db, 'theme'), next);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="p-4 text-zinc-300 text-sm opacity-70">Loading theme settings…</div>
    );
  }

  /** ---- UI ------------------------------------------------------------- */
  return (
    <div className="space-y-8 p-4">
      {/* Presentation block */}
      <section className="rounded-2xl border border-white/10 p-4">
        <h2 className="text-white/90 text-lg font-semibold mb-4">Presentation</h2>

        <label className="block text-sm text-white/70 mb-1">Verses per slide</label>
        <input
          type="number"
          min={1}
          className="w-40 rounded bg-zinc-800 px-3 py-2 outline-none"
          value={presentation.versesPerSlide}
          onChange={(e) => {
            const n = Number(e.target.value || 1);
            patchPresentation({ versesPerSlide: Math.max(1, Math.floor(n)) });
          }}
        />
      </section>

      {/* Theme block */}
      <section className="rounded-2xl border border-white/10 p-4">
        <h2 className="text-white/90 text-lg font-semibold mb-4">Theme</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Font size (px)</label>
            <input
              type="number"
              min={16}
              className="w-40 rounded bg-zinc-800 px-3 py-2 outline-none"
              value={theme.fontSize}
              onChange={(e) => {
                const n = Number(e.target.value || DEFAULT_THEME.fontSize);
                patchTheme({ fontSize: Math.max(16, Math.floor(n)) });
              }}
            />
          </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">Font family</label>
              <select
                className="w-60 rounded bg-zinc-800 px-3 py-2 outline-none"
                value={theme.fontFamily ?? DEFAULT_THEME.fontFamily!}
                onChange={(e) => patchTheme({ fontFamily: e.target.value })}
              >
                <option value="Inter">Inter</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Poppins">Poppins</option>
                <option value="Roboto">Roboto</option>
              </select>
            </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-white/70">Bold</label>
            <input
              type="checkbox"
              checked={!!theme.bold}
              onChange={(e) => patchTheme({ bold: e.target.checked })}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-white/70">Italic</label>
            <input
              type="checkbox"
              checked={!!theme.italic}
              onChange={(e) => patchTheme({ italic: e.target.checked })}
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Line height</label>
            <input
              type="number"
              step="0.05"
              min="1"
              className="w-40 rounded bg-zinc-800 px-3 py-2 outline-none"
              value={theme.lineHeight ?? DEFAULT_THEME.lineHeight!}
              onChange={(e) => {
                const n = Number(e.target.value || DEFAULT_THEME.lineHeight);
                patchTheme({ lineHeight: Math.max(1, n) });
              }}
            />
          </div>
        </div>
      </section>

      {/* Live preview (optional) */}
      <section className="rounded-2xl border border-white/10 p-4">
        <h3 className="text-white/90 text-base font-semibold mb-3">Preview</h3>
        <div
          className="rounded bg-zinc-900 p-6"
          style={{
            fontFamily: theme.fontFamily,
            fontSize: `${theme.fontSize}px`,
            fontWeight: theme.bold ? 700 : 400,
            fontStyle: theme.italic ? 'italic' : 'normal',
            lineHeight: (theme.lineHeight ?? DEFAULT_THEME.lineHeight) as number,
          }}
        >
          <div className="opacity-80 mb-2 text-sm">Sample</div>
          <div>“Sing to the Lord, all the earth!”</div>
        </div>
      </section>
    </div>
  );
}
