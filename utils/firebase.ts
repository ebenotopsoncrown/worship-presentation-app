// utils/firebase.ts
// Single, consolidated Firebase v9+ module used across the app.

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  Auth
} from "firebase/auth";
import {
  getDatabase,
  ref as dbRef,
  child,
  onValue,
  off,
  set,
  update,
  get,
  Database,
  DataSnapshot
} from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  Storage
} from "firebase/storage";

// --- Config from env (must be set on Vercel & .env.local) ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!, // required for RTDB
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!
};

// --- Singleton init ---
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

const auth: Auth = getAuth(app);
const db: Database = getDatabase(app);        // uses databaseURL above
const storage: Storage = getStorage(app);

// --- Core exports (database) ---
export { db, child, onValue, off, set, update, get };
// NOTE: many parts of the app import `ref` from "../utils/firebase"
// To remain backward compatible, we export the **database** ref as `ref`.
export const ref = dbRef;

// --- Core exports (auth) ---
export { auth, signInWithEmailAndPassword, signOut, sendPasswordResetEmail };

// --- Core exports (storage) ---
export { storage, storageRef, uploadBytes, getDownloadURL };

// Small helper to mimic a `refFromURL` style call some code used before.
export const storageRefFromURL = (url: string) => storageRef(storage, url);

// ------------------------------------------------------------------
// Compatibility helpers used in multiple screens (hymns/bible/slides)
// ------------------------------------------------------------------

// Write to a preview slot (1..4). Payload is typically { html: string, meta?: any }
export async function setPreviewSlot(
  slot: number,
  payload: any
): Promise<void> {
  const p = Number(slot);
  if (![1, 2, 3, 4].includes(p)) throw new Error("Invalid preview slot");
  await set(dbRef(db, `previews/${p}`), payload ?? null);
}

// Clear a preview slot
export function clearPreviewSlot(slot: number): Promise<void> {
  return setPreviewSlot(slot, null);
}

// Subscribe to a preview slot. Returns an unsubscribe fn.
export function subscribeToPreview(
  slot: number,
  cb: (value: any, snap: DataSnapshot) => void
): () => void {
  const p = Number(slot);
  const r = dbRef(db, `previews/${p}`);
  const handler = (snap: DataSnapshot) => cb(snap.val(), snap);
  onValue(r, handler);
  return () => off(r, "value", handler);
}

// Set Live content (shown on the projector screen)
export function setLiveContent(payload: any): Promise<void> {
  return set(dbRef(db, "live"), payload ?? null);
}

// Subscribe to Live content. Returns an unsubscribe fn.
export function subscribeToLive(
  cb: (value: any, snap: DataSnapshot) => void
): () => void {
  const r = dbRef(db, "live");
  const handler = (snap: DataSnapshot) => cb(snap.val(), snap);
  onValue(r, handler);
  return () => off(r, "value", handler);
}

// Upload a slide image (PPT converted image or JPG) and return a public URL
export async function uploadSlideImage(file: File): Promise<string> {
  const path = `slides/${Date.now()}-${file.name}`;
  const r = storageRef(storage, path);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}
