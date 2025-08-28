'use client';

import * as React from 'react';
import NavigationBar from './NavigationBar';

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-10 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
      <div className="mx-auto max-w-[1500px] px-3 py-3 text-sm text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold">
            Worship Presentation App — MFM Goshen Assembly
          </div>
          <NavigationBar />
        </div>
      </div>
    </header>
  );
}
