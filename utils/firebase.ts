// utils/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  remove,
  get,
  child,
} from 'firebase/database';
import { getAuth } from 'firebase/auth';

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DB_URL!,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID!,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      });

export const auth = getAuth(app);
export const db = getDatabase(app);

// Primary exports (preferred going forward)
export { ref, onValue, set, update, remove, get, child };

// Back-compat aliases so existing code keeps working
export { ref as dbRef, onValue as dbOnValue, set as dbSet, update as dbUpdate, remove as dbRemove };
// ---- TYPES ----
export type Slot = 1 | 2 | 3 | 4;

type PreviewText = { type: 'text' | 'html'; content: string; meta?: any };
type PreviewImage = { type: 'image'; content: string; meta?: any };
type PreviewSlides = { type: 'slides'; slides: string[]; index?: number; meta?: any };
export type PreviewPayload = PreviewText | PreviewImage | PreviewSlides;

// ---- PREVIEW/LIVE HELPERS ----
const slotPath = (slot: Slot) => `previews/${slot}`;

export const setPreviewSlot = (slot: Slot, payload: PreviewPayload) =>
  dbSet(dbRef(db, slotPath(slot)), payload);

export const clearPreviewSlot = (slot: Slot) =>
  dbRemove(dbRef(db, slotPath(slot)));

export const listenPreviewSlot = (slot: Slot, cb: (val: any) => void) =>
  dbOnValue(dbRef(db, slotPath(slot)), snap => cb(snap.val()));

export const copyPreviewToLive = async (slot: Slot) => {
  const snap = await dbGet(dbRef(db, slotPath(slot)));
  return dbSet(dbRef(db, 'live'), snap.val() ?? null);
};

export const listenLive = (cb: (val: any) => void) =>
  dbOnValue(dbRef(db, 'live'), snap => cb(snap.val()));

if (typeof window !== 'undefined') {
  const check: Record<string, unknown> = {
    setPreviewSlot,
    clearPreviewSlot,
    listenPreviewSlot,
    copyPreviewToLive,
    listenLive,
    ref,      // re-export from RTDB
    onValue,  // re-export from RTDB
  };
  Object.entries(check).forEach(([name, val]) => {
    if (typeof val !== 'function') {
      console.error(`[firebase] "${name}" is NOT a function. Got:`, val);
    }
  });
}

