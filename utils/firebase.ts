// utils/firebase.ts
import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app';
import {
  getDatabase,
  ref as _ref,
  set as _set,
  onValue,
  off,
  get,
  update,
  type DataSnapshot,
} from 'firebase/database';
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';

// ---- CONFIG (all must exist in Vercel env) ----
const cfg: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!, // REQUIRED for RTDB
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Warn at build time if any are missing
if (typeof window !== 'undefined') {
  const missing = Object.entries({
    NEXT_PUBLIC_FIREBASE_API_KEY: cfg.apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: cfg.authDomain,
    NEXT_PUBLIC_FIREBASE_DATABASE_URL: cfg.databaseURL,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: cfg.projectId,
    NEXT_PUBLIC_FIREBASE_APP_ID: cfg.appId,
  }).filter(([, v]) => !v);
  if (missing.length) {
    console.warn('[firebase] Missing env vars:', missing.map(([k]) => k).join(', '));
  }
}

// Avoid double init in dev
const app = getApps().length ? getApps()[0] : initializeApp(cfg);

// Primary handles
export const db = getDatabase(app);
export const auth = getAuth(app);

// Small aliases (compat with your code)
export const dbRef = _ref;
export const set = _set;
export { onValue, off, get, update };

// ----- Diagnostics -----
export function subscribeConnected(handler?: (connected: boolean) => void) {
  const r = dbRef(db, '.info/connected');
  const unsub = onValue(
    r,
    (snap) => {
      const ok = !!snap.val();
      console.info('[firebase] RTDB connected:', ok);
      handler?.(ok);
    },
    (err) => console.error('[firebase] .info/connected error:', err)
  );
  return typeof unsub === 'function' ? unsub : () => off(r);
}

// Write to a preview slot with read-back + logging
export async function setPreviewSlot(
  slot: number,
  payload: { id: string; kind: 'workspace'|'hymn'|'bible'|'slides'; title?: string; html?: string; lines?: string[] }
) {
  const path = `preview_slots/slot${slot}`;
  const ref = dbRef(db, path);
  try {
    console.info('[firebase] setPreviewSlot →', path, payload);
    await _set(ref, payload);
    // echo back immediately so we know RTDB accepted the write
    const snap = await get(ref);
    console.info('[firebase] echo (slot'+slot+'):', snap.exists() ? snap.val() : null);
  } catch (err) {
    console.error('[firebase] setPreviewSlot failed:', path, err);
    throw err;
  }
}

// Subscribe to a preview slot; logs any errors
export function subscribeToPreviewSlot(
  slot: number,
  handler: (value: any | null, snap: DataSnapshot) => void,
  onError?: (err: any) => void
): () => void {
  const path = `preview_slots/slot${slot}`;
  const ref = dbRef(db, path);
  const unsubscribe = onValue(
    ref,
    (snap) => {
      const v = snap.val() ?? null;
      console.info('[firebase] recv slot'+slot+':', v);
      handler(v, snap);
    },
    (err) => {
      console.error('[firebase] onValue error (slot'+slot+'):', err);
      onError?.(err);
    }
  );
  return typeof unsubscribe === 'function' ? unsubscribe : () => off(ref);
}

// Auth helpers (unchanged)
export {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
};
export { _ref as ref };
