// utils/firebase.ts
'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref as dbRef,
  onValue as dbOnValue,
  set as dbSet,
  update as dbUpdate,
  remove as dbRemove,
  get as dbGet,
  child as dbChild,
  type Database,
} from 'firebase/database';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  type Auth,
} from 'firebase/auth';

// ---- CONFIG (must be set in Vercel/GitHub env) ----
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!, // exact RTDB URL for your region
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// ---- INIT ONCE ----
const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(config);
export const db: Database = getDatabase(app, config.databaseURL);
export const auth: Auth = getAuth(app);

// Re-export raw helpers so existing code can do: onValue(ref(db, 'path'), cb)
export {
  dbRef as ref,
  dbOnValue as onValue,
  dbSet as set,
  dbUpdate as update,
  dbRemove as remove,
  dbGet as get,
  dbChild as child,
  onAuthStateChanged,
  signOut,
};

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
