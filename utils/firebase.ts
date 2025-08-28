// utils/firebase.ts
// Single source of truth for Firebase + preview/live helpers.
// Works in both client and Next.js pages/components.

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref as dbRef,
  onValue,
  set,
  remove,
  get,
} from 'firebase/database';
import { getAuth } from 'firebase/auth';

// ---- Config must be present in your Vercel env ----
// NEXT_PUBLIC_FIREBASE_API_KEY
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
// NEXT_PUBLIC_FIREBASE_DB_URL
// NEXT_PUBLIC_FIREBASE_PROJECT_ID
// (optional) NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
// (optional) NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
// (optional) NEXT_PUBLIC_FIREBASE_APP_ID

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DB_URL!, // IMPORTANT
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(cfg);
const db = getDatabase(app);
const auth = getAuth(app);

export { app, db, auth, dbRef, onValue };

// ---------- Preview / Live helpers ----------
export type Slot = 1 | 2 | 3 | 4;
export type Payload =
  | { type: 'text'; content: string }
  | { type: 'html'; content: string }
  | { type: 'image'; content: string }; // dataURL or public URL

const previewPath = (slot: Slot) => `previews/slot${slot}`;

export async function setPreviewSlot(slot: Slot, payload: Payload) {
  await set(dbRef(db, previewPath(slot)), { ...payload, ts: Date.now() });
}

export async function clearPreviewSlot(slot: Slot) {
  await remove(dbRef(db, previewPath(slot)));
}

export function listenPreviewSlot(slot: Slot, cb: (v: any) => void) {
  return onValue(dbRef(db, previewPath(slot)), (snap) => cb(snap.val()));
}

export async function copyPreviewToLive(slot: Slot) {
  const snap = await get(dbRef(db, previewPath(slot)));
  const val = snap.val();
  await set(dbRef(db, 'live'), val ? { ...val, from: slot, ts: Date.now() } : null);
}

export function listenLive(cb: (v: any) => void) {
  return onValue(dbRef(db, 'live'), (snap) => cb(snap.val()));
}

export async function clearLive() {
  await remove(dbRef(db, 'live'));
}
