'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../utils/firebase';

export default function AppHeader() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();// components/AppHeader.tsx
'use client';

import * as React from 'react';
import { auth } from '../utils/firebase';           // your firebase.ts exports `auth`
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function AppHeader() {
  const [user, setUser] = React.useState<null | { displayName?: string; email?: string }>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!auth) return;
    const off = onAuthStateChanged(auth, (u) => {
      // keep only the bits we render; avoids serialising the whole user object
      setUser(u ? { displayName: u.displayName ?? undefined, email: u.email ?? undefined } : null);
    });
    return () => off();
  }, []);

  const handleLogout = async () => {
    if (!auth || busy) return;
    setBusy(true);
    try {
      await signOut(auth);
    } catch (e) {
      // swallow – we’ll still do a hard refresh to get the app into a clean state
      console.warn('signOut failed:', e);
    } finally {
      // IMPORTANT: avoid router.replace(...) — do a safe refresh instead
      window.location.reload();
    }
  };

  return (
    <header className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 px-3 py-2 text-sm text-white">
      <div className="font-semibold">Worship Presentation App — MFM Goshen Assembly</div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-white/15 px-2 py-1">
          {user ? (user.displayName || user.email || 'Signed in') : 'Not signed in'}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-500 disabled:opacity-60"
          disabled={busy || !auth}
          title="Logout"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

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

