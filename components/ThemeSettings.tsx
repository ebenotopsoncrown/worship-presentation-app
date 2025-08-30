'use client';

import { useEffect, useState } from 'react';
import { db, ref, onValue, set } from '../utils/firebase';

type Presentation = {
  versesPerSlide: number;
};

type Theme = {
  fontSize: number;
};

export default function ThemeSettings() {
  const [presentation, setPresentation] = useState<Presentation>({ versesPerSlide: 2 });
  const [theme, setTheme] = useState<Theme>({ fontSize: 48 });

  useEffect(() => {
    const off1 = onValue(ref(db, 'settings/presentation'), (snap) => {
      if (snap.exists()) setPresentation(snap.val() as Presentation);
    });
    const off2 = onValue(ref(db, 'settings/theme'), (snap) => {
      if (snap.exists()) setTheme(snap.val() as Theme);
    });
    return () => {
      off1();
      off2();
    };
  }, []);

  return (
    <div className="space-y-4 text-zinc-200">
      <div>
        <label className="block mb-1">Verses per slide</label>
        <input
          className="bg-zinc-800 rounded px-2 py-1 w-24"
          type="number"
          min={1}
          value={presentation.versesPerSlide ?? 2}
          onChange={(e) =>
            setPresentation((p) => ({
              ...p,
              versesPerSlide: Number(e.target.value || 1),
            }))
          }
        />
        <button
          className="ml-2 px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600"
          onClick={() => set(ref(db, 'settings/presentation'), presentation)}
        >
          Save
        </button>
      </div>

      <div>
        <label className="block mb-1">Font size</label>
        <input
          className="bg-zinc-800 rounded px-2 py-1 w-24"
          type="number"
          value={theme.fontSize ?? 48}
          onChange={(e) =>
            setTheme((t) => ({
              ...t,
              fontSize: Number(e.target.value || 48),
            }))
          }
        />
        <button
          className="ml-2 px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600"
          onClick={() => set(ref(db, 'settings/theme'), theme)}
        >
          Save
        </button>
      </div>
    </div>
  );
}
