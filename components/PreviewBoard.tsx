'use client';
import React from 'react';
import PreviewPane from './PreviewPane';

export default function PreviewBoard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <PreviewPane slot={1} title="Preview 1 (Queued)" />
      <PreviewPane slot={2} title="Preview 2" />
      <PreviewPane slot={3} title="Preview 3" />
      <PreviewPane slot={4} title="Preview 4" />
    </div>
  );
}
