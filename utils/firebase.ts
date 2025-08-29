// utils/firebase.ts
// Single source of truth for Firebase. Uses modular v9 SDK only.
// We DO NOT re-export low-level names like `onValue` to avoid collisions.

import { getApps, getApp, initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref as dbRef,
  onValue as dbOnValue,
  set as dbSet,
  update as dbUpdate,
  remove as dbRemove,
  get,
  child
} from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  // IMPORTANT: include the RTDB URL so you don’t get the “database lives in a different region” warning
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DB_URL!, // e.g. https://your-project-id-default-rtdb.europe-west1.firebasedatabase.app
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);

// ---- Preview / Live helpers -------------------------------------------------

export type Slot = 1 | 2 | 3 | 4;

export type PreviewPayload =
  | { type: 'text'; content: string; meta?: any }
  | { type: 'html'; content: string; meta?: any }
  | { type: 'image'; content: string; meta?: any }
  | { type: 'slides'; slides: string[]; index: number; meta?: any };

const slotRef = (slot: Slot) => dbRef(db, `previews/${slot}`);

export function listenPreviewSlot(slot: Slot, cb: (value: any) => void) {
  return dbOnValue(slotRef(slot), (snap) => cb(snap.val()));
}

export function clearPreviewSlot(slot: Slot) {
  return dbRemove(slotRef(slot));
}

export function setPreviewSlot(slot: Slot, payload: PreviewPayload) {
  return dbSet(slotRef(slot), payload);
}

export async function copyPreviewToLive(slot: Slot) {
  const snap = await get(child(dbRef(db), `previews/${slot}`));
  await dbSet(dbRef(db, 'live'), snap.val() ?? null);
}

export function listenLive(cb: (value: any) => void) {
  return dbOnValue(dbRef(db, 'live'), (snap) => cb(snap.val()));
}

// ---- Hymn library helper (optional, used by HymnDisplay) --------------------

export function listenHymnLibrary(cb: (value: any) => void) {
  // Change the path if your data lives under a different key
  return dbOnValue(dbRef(db, 'hymn_library'), (snap) => cb(snap.val()));
}

// NOTE: We intentionally DO NOT export `onValue`, `ref`, etc. directly.
// Import those from `firebase/database` only if you truly need them in a component.
