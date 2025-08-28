// utils/firebase.ts
'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getDatabase,
  ref as rtdbRef,
  onValue,
  set,
  get,
  remove,
  DatabaseReference,
} from 'firebase/database';

/** ---- App + Services (safe for client-only use) ---- */
const app =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DB_URL!, // REQUIRED: the regioned RTDB URL
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      });

export const auth = getAuth(app);

// Always bind the DB to the regioned URL to avoid the “Database lives in a different region” warning.
export const db = getDatabase(app, process.env.NEXT_PUBLIC_FIREBASE_DB_URL);

/** Small alias so existing code can keep importing `ref` */
export const ref = (path: string): DatabaseReference => rtdbRef(db, path);

/** ---- Types and helpers used by the app ---- */
export type Slot = 1 | 2 | 3 | 4;

export type PreviewPayload =
  | { type: 'text'; content: string }
  | { type: 'html'; content: string }
  | { type: 'image'; content: string }                     // data URL or absolute URL
  | { kind: 'slides'; slides: string[]; index: number };   // slide HTML pages

/** Listen to a preview slot */
export const listenPreviewSlot = (slot: Slot, cb: (val: any) => void) => {
  return onValue(ref(`previews/${slot}`), (snap) => cb(snap.val()));
};

/** Set/clear a preview slot */
export const setPreviewSlot = async (slot: Slot, payload: PreviewPayload) => {
  await set(ref(`previews/${slot}`), { ...payload, ts: Date.now() });
};

export const clearPreviewSlot = async (slot: Slot) => {
  await remove(ref(`previews/${slot}`));
};

/** Copy a preview slot to the live channel */
export const copyPreviewToLive = async (slot: Slot) => {
  const src = ref(`previews/${slot}`);
  const dst = ref('live');
  const snap = await get(src);
  await set(dst, snap.val() ?? null);
};

/** Listen to the live channel (used by /live) */
export const listenLive = (cb: (val: any) => void) => {
  return onValue(ref('live'), (snap) => cb(snap.val()));
};
