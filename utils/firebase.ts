// utils/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  remove,
  child,
  get,
  type Database,
} from 'firebase/database';
import { getAuth } from 'firebase/auth';

/** IMPORTANT: all NEXT_PUBLIC_* envs must be set in Vercel */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DB_URL!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db: Database = getDatabase(app);
export const auth = getAuth(app);

/** Re-exports so existing imports keep working */
export { ref, onValue, set, update, remove, child, get };
export { ref as dbRef }; // some files import { dbRef } specifically

/** Keep Slot flexible across the app to avoid TS friction */
export type Slot = number;

/** Payloads used around previews/live (kept permissive to avoid type clashes) */
export type PreviewPayload = any;

/** Paths */
const previewPath = (slot: Slot) => `previews/${slot}`;
const livePath = `live_content`;
const boardPath = `preview_board`;

/** ---------- Preview helpers ---------- */

export const setPreviewSlot = (slot: Slot, payload: PreviewPayload) =>
  set(ref(db, previewPath(slot)), payload);

export const clearPreviewSlot = (slot: Slot) =>
  remove(ref(db, previewPath(slot)));

export const setPreviewIndex = (slot: Slot, index: number) =>
  update(ref(db, previewPath(slot)), { index });

export const listenPreviewSlot = (
  slot: Slot,
  cb: (payload: PreviewPayload | null) => void
) => onValue(ref(db, previewPath(slot)), snap => cb((snap.val() as any) ?? null));

/** ---------- Live helpers ---------- */

export type LivePayload = {
  html?: string;
  lines?: string[];
  title?: string;
  from?: string;
} | null;

export const setLiveContent = (payload: any) =>
  set(ref(db, livePath), payload);

export const listenLive = (cb: (payload: any) => void) =>
  onValue(ref(db, livePath), snap => cb(snap.val()));

/** ---------- Board helpers (if used) ---------- */

export const listenPreviewBoard = (cb: (value: any) => void) =>
  onValue(ref(db, boardPath), snap => cb(snap.val()));

export function subscribeToLive(
  cb: (value: LivePayload) => void
): () => void {
  const r = ref(db, 'live');          // use your existing exported `db` and `ref`
  // onValue returns an unsubscribe function
  return onValue(r, snap => {
    cb(snap.exists() ? (snap.val() as LivePayload) : null);
  });
}
