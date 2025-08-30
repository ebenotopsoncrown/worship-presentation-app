'use client';
import React from 'react';
import AppHeader from '../components/AppHeader';
import PreviewBoard from '../components/PreviewBoard';
import BibleDisplay from '../components/BibleDisplay';

export default function HomePage() {
  return (
    <main className="max-w-[1100px] mx-auto p-4 space-y-4">
      <AppHeader />
      <div className="rounded-xl bg-zinc-950 p-4 text-zinc-200 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <BibleDisplay />
        </div>

        <PreviewBoard />

        <div className="rounded-xl overflow-hidden border border-white/10">
          <div className="px-3 py-2 text-sm font-medium bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white">
            Live View
          </div>
          <iframe
            src="/live"
            title="Live"
            className="w-full"
            style={{ height: 'calc(100vh - 220px)' }}
          />
        </div>
      </div>
    </main>
  );
}
