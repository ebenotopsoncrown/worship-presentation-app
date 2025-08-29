'use client';

import * as React from 'react';
import NavigationBar from './NavigationBar';

export default function AppHeader() {
  return (
    <header className="rounded-2xl p-3 text-sm font-semibold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
      <div className="flex items-center justify-between gap-3">
        <div className="truncate">Worship Presentation App — MFM Goshen Assembly</div>
        <NavigationBar />
      </div>
    </header>
  );
}
