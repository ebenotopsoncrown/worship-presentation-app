// utils/firebase.ts
'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  type Auth,
} from 'firebase/auth';

import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  remove,
  get,
  child,
  type Database,
} from 'firebase/database';

/* ------------------------------------------------------------------ */
/* Init                                                                */
/* ------------------------------------------------------------------ */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Database = firebaseConfig.databaseURL
  ? getDatabase(app, firebaseConfig.databaseURL)
  : getDatabase(app);

/* ------------------------------------------------------------------ */
/* Re-exports (canonical names)                                        */
/* ------------------------------------------------------------------ */
export { ref, onValue, set, update, remove, get, child };

/* ------------------------------------------------------------------ */
/* Re-exports (compat aliases to match existing code)                  */
/* ------------------------------------------------------------------ */
// Many components import these names; provide them to stop build breaks.
export {
  ref as dbRef,
  onValue as dbOnValue,
  set as dbSet,
  update as dbUpdate,
  remove as dbRemove,
};

/* Auth helpers used in pages/login, etc. */
export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
};

/* ------------------------------------------------------------------ */
/* Shared types + helpers (previews & live)                            */
/* ------------------------------------------------------------------ */

export type Slot = 1 | 2 | 3 | 4;
export const SLOT_COUNT = 4;

export type HtmlPayload = { type: 'html'; content: string };
export type SlidesPayload = { kind: 'slides'; slides: string[]; index?: number };
export type PreviewPayload = HtmlPayload | SlidesPayload;
export type LivePayload = PreviewPayload | null;

const slotPath = (slot: Slot) => `previews/${slot}`;

/* ------------------------------ Previews --------------------------- */

export function setPreviewSlot(slot: Slot, payload: PreviewPayload) {
  return set(ref(db, slotPath(slot)), payload);
}

export function setPreviewIndex(slot: Slot, index: number) {
  return update(ref(db, slotPath(slot)), { index });
}

export function clearPreviewSlot(slot: Slot) {
  return remove(ref(db, slotPath(slot)));
}

export function listenPreviewSlot(
  slot: Slot,
  cb: (payload: PreviewPayload | null) => void
): () => void {
  const r = ref(db, slotPath(slot));
  return onValue(r, (snap) => {
    cb(snap.exists() ? (snap.val() as PreviewPayload) : null);
  });
}

export async function copyPreviewToLive(slot: Slot) {
  const root = ref(db);
  const snap = await get(child(root, slotPath(slot)));
  return set(ref(db, 'live'), snap.exists() ? snap.val() : null);
}

/* ------------------------------- Live ------------------------------ */

export function setLiveContent(payload: LivePayload) {
  return set(ref(db, 'live'), payload);
}

export function subscribeToLive(cb: (value: LivePayload) => void): () => void {
  const r = ref(db, 'live');
  return onValue(r, (snap) => {
    cb(snap.exists() ? (snap.val() as LivePayload) : null);
  });
}
