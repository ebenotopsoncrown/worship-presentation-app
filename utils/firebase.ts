// utils/firebase.ts
// Single place for Firebase initialization + thin helpers used by the app.

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged as fbOnAuthStateChanged,
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail as fbSendPasswordResetEmail,
  Auth,
} from "firebase/auth";
import {
  getDatabase,
  ref as dbRefRaw,
  onValue as fbOnValue,
  set as fbSet,
  update as fbUpdate,
  remove as fbRemove,
  DataSnapshot,
  Database,
  DatabaseReference,
} from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL as fbGetDownloadURL,
  deleteObject as fbDeleteObject,
  Storage,
} from "firebase/storage";

// -----------------------------------------------------------------------------
// App initialization
// -----------------------------------------------------------------------------

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  // IMPORTANT for Realtime Database when rendering on server (Vercel build)
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
};

export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Database = getDatabase(app);
export const storage: Storage = getStorage(app);

// -----------------------------------------------------------------------------
// Paths used by this app (keep in sync with index.tsx)
// -----------------------------------------------------------------------------

const previewPath = (slot: number) => `preview_slots/slot${slot}`;
const livePath = `live_content`;

// Expose reference builders so components/pages can use them if they like
export const previewRef = (slot: number) => dbRefRaw(db, previewPath(slot));
export const liveRef = () => dbRefRaw(db, livePath);

// -----------------------------------------------------------------------------
// Tiny DB helpers – match the names your code imports
// -----------------------------------------------------------------------------

// Create a DB ref from a string (so callers can do: ref("some/path"))
export const ref = (path: string): DatabaseReference => dbRefRaw(db, path);

// Keep a "dbRef" alias too, since some files previously used that name.
export const dbRef = (path: string): DatabaseReference => dbRefRaw(db, path);

// onValue wrapper (same signature your code expects)
export const onValue = (
  reference: DatabaseReference,
  callback: (snapshot: DataSnapshot) => void
) => fbOnValue(reference, callback);

// set/update/remove that accept either a path string or a DatabaseReference
const asRef = (pathOrRef: string | DatabaseReference) =>
  typeof pathOrRef === "string" ? dbRefRaw(db, pathOrRef) : pathOrRef;

export const set = (pathOrRef: string | DatabaseReference, value: any) =>
  fbSet(asRef(pathOrRef), value);

export const update = (pathOrRef: string | DatabaseReference, value: any) =>
  fbUpdate(asRef(pathOrRef), value);

export const remove = (pathOrRef: string | DatabaseReference) =>
  fbRemove(asRef(pathOrRef));

// -----------------------------------------------------------------------------
// Preview & Live helpers
// -----------------------------------------------------------------------------

export const setPreviewSlot = async (slot: number, value: any) => {
  await fbSet(previewRef(slot), value);
};

export const clearPreviewSlot = async (slot: number) => {
  await fbRemove(previewRef(slot));
};

export const subscribeToPreview = (
  slot: number,
  cb: (value: any) => void
): (() => void) => {
  const off = fbOnValue(previewRef(slot), (snap) => cb(snap.val()));
  // Return unsubscribe
  return () => off();
};

export const setLiveContent = async (value: any) => {
  await fbSet(liveRef(), value);
};

export const clearLiveContent = async () => {
  await fbRemove(liveRef());
};

export const subscribeToLive = (cb: (value: any) => void): (() => void) => {
  const off = fbOnValue(liveRef(), (snap) => cb(snap.val()));
  return () => off();
};

// -----------------------------------------------------------------------------
// Auth re-exports (names your code already uses)
// -----------------------------------------------------------------------------

export const onAuthStateChanged = fbOnAuthStateChanged;
export const signInWithEmailAndPassword = fbSignInWithEmailAndPassword;
export const signOut = fbSignOut;
export const sendPasswordResetEmail = fbSendPasswordResetEmail;

// -----------------------------------------------------------------------------
// Storage helpers (used by Slides / image uploads)
// -----------------------------------------------------------------------------

// Upload an image for slides (jpg/png). Returns the download URL.
export async function uploadSlideImage(file: File): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `slides/${Date.now()}_${safeName}`;
  const sref = storageRef(storage, path);
  await uploadBytes(sref, file);
  return await fbGetDownloadURL(sref);
}

// Create a storage ref from a public URL (handy when we only have a URL)
export const storageRefFromURL = (url: string) => storageRef(storage, url);

// Re-export a couple of helpers some code may import
export const getDownloadURL = fbGetDownloadURL;
export const deleteObject = fbDeleteObject;
