// utils/firebase.ts
'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref as dbRef,
  onValue as dbOnValue,
  off as dbOff,
  set as dbSet,
  DataSnapshot,
  Database,
} from 'firebase/database';
import {
  getAuth,
  onAuthStateChanged as authOnAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  Auth,
} from 'firebase/auth';

// ---- CONFIG ----
// Prefer environment variables. Ensure DATABASE_URL is set.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!, // REQUIRED for RTDB
};

// Single app instance (avoids “already exists” in dev/hot reload)
const app: FirebaseApp =
  getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

// Core services
export const db: Database = getDatabase(app);
export const auth: Auth = getAuth(app);

// Re-export onAuthStateChanged so components can import from ../utils/firebase
export const onAuthStateChanged = authOnAuthStateChanged;

// Convenience ref(): bind db so callers can do ref('path')
export const ref = (path: string) => dbRef(db, path);

// Re-export low-level RTDB helpers (names your code already uses)
export const onValue = dbOnValue;
export const off = dbOff;
export const set = dbSet;

// ---------- High-level helpers your UI expects ----------

/** Subscribe to a DB path and get an unsubscribe you can call in useEffect cleanup */
const listenPath = <T = unknown>(
  path: string,
  cb: (value: T | null, snap: DataSnapshot) => void
) => {
  const r = ref(path);
  const handler = (snap: DataSnapshot) => cb(snap.val() as T | null, snap);
  dbOnValue(r, handler);
  // Return explicit unsubscribe compatible with RTDB
  return () => dbOff(r, 'value', handler);
};

/** Previews */
export const setPreviewSlot = async (
  slot: number,
  payload: any // { html?: string, data?: unknown, ... }
) => {
  const ts = Date.now();
  return dbSet(ref(`previews/${slot}`), { ...payload, ts });
};

export const listenPreviewSlot = (
  slot: number,
  cb: (value: any | null) => void
) => listenPath<any>(`previews/${slot}`, (val) => cb(val));

/** Live */
export const setLive = async (payload: any) => {
  const ts = Date.now();
  return dbSet(ref('live'), { ...payload, ts });
};

export const listenLive = (cb: (value: any | null) => void) =>
  listenPath<any>('live', (val) => cb(val));

/** Optional auth helpers if you use them somewhere */
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};
export const logout = () => signOut(auth);
