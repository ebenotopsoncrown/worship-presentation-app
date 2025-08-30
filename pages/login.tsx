'use client';
import React from 'react';
import { useRouter } from 'next/router';
import { auth, signInWithEmailAndPassword, sendPasswordResetEmail } from '../utils/firebase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent.');
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset email');
    }
  };

  return (
    <main className="max-w-md mx-auto p-4 text-zinc-200">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <form onSubmit={doLogin} className="space-y-3">
        <input
          className="w-full bg-zinc-800 rounded px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full bg-zinc-800 rounded px-3 py-2"
          placeholder="Password"
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            disabled={busy}
            className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
            type="submit"
          >
            Sign in
          </button>
          <button
            type="button"
            className="px-3 py-2 rounded bg-zinc-700 hover:bg-zinc-600"
            onClick={reset}
          >
            Reset password
          </button>
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
      </form>
    </main>
  );
}
