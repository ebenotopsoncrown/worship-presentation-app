// utils/firebase.ts  — modular Firebase ONLY (no compat)
// This file centralizes all Firebase initialization and exports.

import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref as dbRef,
  onValue,
  off,
  set,
  update,
  remove,
  push,
  child,
  type DatabaseReference,
} from 'firebase/database';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import {
  getStorage,
  ref as fileRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  ref as storageRef,          // alias for clarity
  refFromURL as storageRefFromURL,
} from 'firebase/storage';

// ───────────────────────────────────────────────────────────────────────────────
// Keep YOUR existing config values here (env or inline). The keys must be the same.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FB_DB_URL!,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE!,
  messagingSenderId: process.env.NEXT_PUBLIC_FB_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID!,
};
// ───────────────────────────────────────────────────────────────────────────────

export const app = initializeApp(firebaseConfig);

// Core services (singletons)
export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Re-export the DB helpers so callers import only from this file
export {
  dbRef, onValue, off, set, update, remove, push, child,
  type DatabaseReference,
};
export { onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, signOut };

// Convenience paths/refs used around the app
export const previewPath = (slot: number) => `preview/${slot}`;
export const livePath = 'live';

export const previewRef = (slot: number) => dbRef(db, previewPath(slot));
export const liveRef = () => dbRef(db, livePath);

// ───────────────────────────────────────────────────────────────────────────────
// Slides (Storage) helpers
//  - uploadSlideImage(file) -> returns public URL
//  - deleteSlideByUrl(url)  -> best-effort delete from Storage

export async function uploadSlideImage(file: File, folder = 'slides'): Promise<string> {
  const safeName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const r = fileRef(storage, `${folder}/${safeName}`);
  await uploadBytes(r, file);
  return await getDownloadURL(r);
}

export async function deleteSlideByUrl(url: string): Promise<void> {
  try {
    const r = storageRefFromURL(url);
    await deleteObject(r);
  } catch {
    // ignore—URL may be external or already deleted
  }
}

// Optional small wrapper to keep old call sites working if any existed:
export function subscribeToLive(cb: (val: any) => void): () => void {
  const r = liveRef();
  const unsubscribe = onValue(r, (snap) => cb(snap.val()));
  return () => off(r);
}
