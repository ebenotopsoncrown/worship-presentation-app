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
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';

const cfg: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!, // REQUIRED
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApps()[0] : initializeApp(cfg);

export const db = getDatabase(app);
export const auth = getAuth(app);

export const dbRef = _ref;
export const set = _set;
export { onValue, off, get, update, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut, sendPasswordResetEmail };

// ---- Diagnostics ----
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

// ---------- PREVIEW SLOTS ----------
export async function setPreviewSlot(
  slot: number,
  payload: { id: string; kind: 'workspace'|'hymn'|'bible'|'slides'; title?: string; html?: string; lines?: string[] }
) {
  const path = `preview_slots/slot${slot}`;
  const ref = dbRef(db, path);
  try {
    console.info('[firebase] setPreviewSlot →', path, payload);
    await _set(ref, payload);
    const snap = await get(ref);
    console.info('[firebase] echo (slot'+slot+'):', snap.exists() ? snap.val() : null);
  } catch (err) {
    console.error('[firebase] setPreviewSlot failed:', path, err);
    throw err;
  }
}

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

// ---------- LIVE CONTENT ----------
export async function setLiveContent(
  payload: { id: string; from: 'workspace'|'hymn'|'bible'|'slides'; title?: string; html?: string; lines?: string[] }
) {
  const ref = dbRef(db, 'live_content');
  try {
    console.info('[firebase] setLiveContent →', payload);
    await _set(ref, payload);
    const snap = await get(ref);
    console.info('[firebase] echo (live):', snap.exists() ? snap.val() : null);
  } catch (err) {
    console.error('[firebase] setLiveContent failed:', err);
    throw err;
  }
}

export function subscribeToLive(
  handler: (value: any | null, snap: DataSnapshot) => void,
  onError?: (err: any) => void
): () => void {
  const ref = dbRef(db, 'live_content');
  const unsubscribe = onValue(
    ref,
    (snap) => {
      const v = snap.val() ?? null;
      console.info('[firebase] recv live:', v);
      handler(v, snap);
    },
    (err) => {
      console.error('[firebase] onValue live error:', err);
      onError?.(err);
    }
  );
  return typeof unsubscribe === 'function' ? unsubscribe : () => off(ref);
}
