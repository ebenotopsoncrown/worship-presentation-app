// utils/firebase.ts
import { getDatabase, ref as dbRef, onValue, get, set } from 'firebase/database';
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

// ---- Re-exports (compat with existing imports) ----
export { ref, onValue, set, off, update } from "firebase/database";
export { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

// ---- Helpers ----
export const dbRef = (path: string) => ref(db, path);

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

const previewRef = (slot: number) => ref(db, `preview_slots/${slot}`);
const liveRef = ref(db, "live_content");

// Write preview payload
export async function setPreviewSlot(slot: number, payload: PreviewPayload) {
  await set(previewRef(slot), payload);
}

// Listen to preview slot
export function listenPreviewSlot(
  slot: number,
  cb: (payload: PreviewPayload) => void
) {
  const r = previewRef(slot);
  const unsub = onValue(r, (snap) =>
    cb((snap.exists() ? (snap.val() as PreviewPayload) : null))
  );
  return () => off(r);
}

// Update current slide index for queued previews
export async function setPreviewIndex(slot: number, index: number) {
  await update(previewRef(slot), { index });
}

// Set/Listen live content
export async function setLiveContent(payload: { html: string; meta?: any }) {
  await set(liveRef, { ...payload, ts: serverTimestamp() });
}
export function listenLiveContent(
  cb: (payload: { html: string; meta?: any } | null) => void
) {
  const unsub = onValue(liveRef, (snap) =>
    cb((snap.exists() ? (snap.val() as any) : null))
  );
  return () => off(liveRef);
}

// Clear preview; if it's what's live, clear live too.
export async function clearPreviewSlot(slot: number) {
  // read live first
  const liveSnap = await get(liveRef);
  const liveVal = liveSnap.exists() ? (liveSnap.val() as any) : null;

  // clear the preview slot
  await set(previewRef(slot), null);

  // if live is sourced from this slot, clear live too
  if (liveVal?.meta?.fromPreview === slot) {
    await set(liveRef, null);
  }
}

// Optional: upload slide image to Storage (not required for current data-URL flow)
export async function uploadSlideImage(file: Blob, filename?: string): Promise<string> {
  const name = filename || `slide-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
  const sref = storageRef(storage, `slides/${name}`);
  await uploadBytes(sref, file);
  return await getDownloadURL(sref);
}
