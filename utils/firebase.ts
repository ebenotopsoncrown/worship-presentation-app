// utils/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  onValue,
  off,
  serverTimestamp,
  DatabaseReference,
} from "firebase/database";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

// ---- App init ----
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// ---- Legacy-style re-exports (to satisfy existing imports) ----
// Some files do: import { ref as dbRef, onValue, set, auth } from '../utils/firebase'
export { ref, onValue, set, off } from "firebase/database";
export { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

// ---- Paths ----
const previewRef = (slot: number) => ref(db, `preview_slots/${slot}`);
const liveRef = ref(db, "live_content");

// ---- Types ----
export type PreviewSlidesPayload = {
  kind: "slides";
  slides: string[];
  index?: number;
  meta?: any;
};
export type PreviewHtmlPayload = {
  html: string;
  meta?: any;
};
export type PreviewPayload = PreviewSlidesPayload | PreviewHtmlPayload | null;

// ---- Preview helpers (new) ----
export async function setPreviewSlot(slot: number, payload: PreviewPayload) {
  await set(previewRef(slot), payload);
}

export function listenPreviewSlot(
  slot: number,
  cb: (payload: PreviewPayload) => void
) {
  const r = previewRef(slot);
  const unsub = onValue(r, (snap) => cb((snap.exists() ? snap.val() : null) as PreviewPayload));
  // Return an unsubscribe function
  return () => off(r);
}

export async function setLiveContent(payload: { html: string; meta?: any }) {
  await set(liveRef, {
    ...payload,
    ts: serverTimestamp(),
  });
}

export function listenLiveContent(cb: (payload: { html: string; meta?: any } | null) => void) {
  const unsub = onValue(liveRef, (snap) =>
    cb((snap.exists() ? snap.val() : null) as any)
  );
  return () => off(liveRef);
}

// ---- Compatibility shims for older code ----
/** Old name used somewhere; keep it working. */
export const subscribeToLive = listenLiveContent;

/** Some code imports `dbRef` from this module (aliasing `ref`). */
export { ref as dbRef } from "firebase/database";

/** Upload an image and return a public URL (used by Slides panel). */
export async function uploadSlideImage(file: Blob, filename?: string): Promise<string> {
  const name =
    filename ||
    `slide-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
  const sref = storageRef(storage, `slides/${name}`);
  await uploadBytes(sref, file);
  return await getDownloadURL(sref);
}
