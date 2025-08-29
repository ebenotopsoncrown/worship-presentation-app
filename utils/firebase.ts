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

export type Slot = 1 | 2 | 3 | 4;

// Init (bind DB to the *regioned* URL to silence region warnings)
const app =
  getApps().length ? getApp() : initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!, // full URL
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  });

// IMPORTANT: pass the regioned URL again here
export const db = getDatabase(app, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL);
export const auth = getAuth(app);

// Small alias so existing code can keep importing `ref`
export const ref = (path: string): DatabaseReference => rtdbRef(db, path);

// --- Preview + Live helpers -------------------------------------------------

export const listenPreviewSlot = (slot: Slot, cb: (val: any) => void) =>
  onValue(ref(`previews/${slot}`), (snap) => cb(snap.val()));

export const setPreviewSlot = async (slot: Slot, payload: any) =>
  set(ref(`previews/${slot}`), { ...payload, ts: Date.now() });

export const clearPreviewSlot = async (slot: Slot) =>
  remove(ref(`previews/${slot}`));

export const copyPreviewToLive = async (slot: Slot) => {
  const src = ref(`previews/${slot}`);
  const dst = ref('live');
  const snap = await get(src);
  await set(dst, snap.val() ?? null);
};

export const listenLive = (cb: (val: any) => void) =>
  onValue(ref('live'), (snap) => cb(snap.val()));
