'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../utils/firebase';

export default function AppHeader() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 p-3 text-white">
        <h1 className="text-lg font-extrabold tracking-wide drop-shadow-sm md:text-2xl">
          Worship Presentation App — <span className="opacity-90">MFM Goshen Assembly</span>
        </h1>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold md:text-sm">
            {user ? `Operator: ${user.displayName || user.email || 'Signed in'}` : 'Not signed in'}
          </span>
          <button onClick={handleLogout} className="btn btn-green" type="button" aria-label="Logout">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
