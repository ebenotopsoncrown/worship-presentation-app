'use client';

import * as React from 'react';
import NavigationBar from './NavigationBar';

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-10 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white">
      <div className="max-w-[1500px] mx-auto flex items-center justify-between p-3">
        <div className="text-xl font-semibold">
          Worship Presentation App — MFM Goshen Assembly
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-black/30 px-3 py-1 text-sm">Not signed in</span>
          <button
            type="button"
            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-sm"
            onClick={() => {}}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto p-3">
        <NavigationBar />
      </div>
    </header>
  );
}
