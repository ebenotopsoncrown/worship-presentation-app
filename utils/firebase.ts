// utils/firebase.ts
// Single source of truth for app, db and storage + tiny helpers the UI uses.

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref as dbRef,
  onValue,
  set,
  update,
  type DatabaseReference,
} from 'firebase/database';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

// --- Your Firebase config ------------------------------------
// Keep your existing config or wire these to NEXT_PUBLIC_* envs.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!, // enable in console to use image upload
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// --- Bootstrap (idempotent) ----------------------------------
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = (() => {
  try {
    return getStorage(app);
  } catch {
    // storage not enabled — that's ok; uploadSlideImage will no-op
    return null as any;
  }
})();

// --- Refs used in the UI -------------------------------------
export type Slot = 1 | 2 | 3 | 4;

export const previewRef = (slot: Slot) => dbRef(db, `previews/${slot}`);
export const liveRef = () => dbRef(db, 'live');

// --- Helpers consumed by components --------------------------

// Write a preview payload for a given slot (1..4).
// payload: { id, kind, title, html?, lines? }
export async function setPreviewSlot(slot: Slot, payload: any) {
  await set(previewRef(slot), payload);
}

// Subscribe to the live payload. Returns an unsubscribe function.
export function subscribeToLive(cb: (value: any) => void) {
  const off = onValue(liveRef(), (snap) => cb(snap.val() ?? null));
  return () => off();
}

// Optional quality-of-life: upload an image to Storage and return CDN URL.
// If Storage isn't configured, we just return '' and the caller keeps its data URL.
export async function uploadSlideImage(file: File): Promise<string> {
  if (!storage) return '';
  const path = `uploads/slides/${Date.now()}-${file.name}`;
  const sRef = storageRef(storage, path);
  await uploadBytes(sRef, file, { contentType: file.type });
  return await getDownloadURL(sRef);
}
