// components/AppHeader.tsx
'use client';

import * as React from 'react';
import { auth } from '../utils/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function AppHeader() {
  const [user, setUser] = React.useState<null | { displayName?: string | null; email?: string | null }>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!auth) return;
    const off = onAuthStateChanged(auth, (u) => {
      setUser(u ? { displayName: u.displayName, email: u.email } : null);
    });
    return () => off();
  }, []);

  const handleLogout = async () => {
    if (!auth || busy) return;
    setBusy(true);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('signOut failed:', e);
    } finally {
      // Avoid router.replace crashes; do a safe full refresh.
      window.location.reload();
    }
  };

  return (
    <header className="rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 px-3 py-2 text-sm text-white">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Worship Presentation App — MFM Goshen Assembly</div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/15 px-2 py-1">
            {user ? (user.displayName || user.email || 'Signed in') : 'Not signed in'}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-500 disabled:opacity-60"
            disabled={busy}
            title="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
