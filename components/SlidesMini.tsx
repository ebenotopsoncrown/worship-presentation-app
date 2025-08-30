'use client';
import React from 'react';

type Props = { slides?: string[] };

export default function SlidesMini({ slides = [] }: Props) {
  return (
    <div className="text-zinc-200 text-sm space-y-2">
      {slides.length === 0 ? (
        <div className="opacity-60">No slides</div>
      ) : (
        slides.map((s, i) => (
          <div key={i} className="p-2 rounded bg-zinc-800">{s}</div>
        ))
      )}
    </div>
  );
}
