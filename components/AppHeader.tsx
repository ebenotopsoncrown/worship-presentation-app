// components/AppHeader.tsx
'use client';
import React from 'react';
import NavigationBar from './NavigationBar';

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="text-lg font-bold">
          Worship Presentation App — MFM Goshen Assembly
        </div>
        <NavigationBar />
      </div>
    </header>
  );
}
