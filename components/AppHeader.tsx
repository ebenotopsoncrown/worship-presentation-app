'use client';
import React from 'react';
import NavigationBar from './NavigationBar';
import { auth, onAuthStateChanged, signOut } from '../utils/firebase';

export default function AppHeader() {
  const [user, setUser] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u?.email ?? null));
    return () => unsub();
  }, []);

  return (
    <header className="w-full px-4 py-3 flex items-center justify-between bg-zinc-900 text-white rounded-xl">
      <div className="text-lg font-semibold">Worship Presentation App</div>
      <NavigationBar />
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <span className="text-xs opacity-80">{user}</span>
            <button
              className="px-2 py-1 text-sm rounded bg-red-600 hover:bg-red-500"
              onClick={() => signOut(auth)}
            >
              Logout
            </button>
          </>
        ) : (
          <span className="text-xs opacity-60">Not signed in</span>
        )}
      </div>
    </header>
  );
}
