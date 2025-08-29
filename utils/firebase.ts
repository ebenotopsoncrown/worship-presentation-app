// utils/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  remove,
  get,
  child,
  DatabaseReference,
} from 'firebase/database';
import { getAuth } from 'firebase/auth';

/* ---------------- Paths (adjust here if your DB uses other keys) --------------- */
const PREVIEW_ROOT = 'preview_slots';   // change to 'previews' if your DB uses that
const LIVE_ROOT    = 'live_content';

/* ---------------- Firebase init (modular v9) ----------------------------------- */
const app =
  getApps().length ? getApp() : initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DB_URL!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  });

export const auth = getAuth(app);
export const db   = getDatabase(app);

/* ---------------- Primary DB helpers (preferred) ------------------------------- */
export { ref, onValue, set, update, remove, get, child };

/* ---------------- Back-compat aliases (so old imports keep working) ------------ */
export { ref as dbRef, onValue as dbOnValue, set as dbSet, update as dbUpdate, remove as dbRemove };

/* ---------------- Types shared by the app -------------------------------------- */
export type Slot = 1 | 2 | 3 | 4;

export type HtmlPayload = { type: 'html'; content: string; meta?: any };
export type SlidesPayload = { type: 'slides'; slides: string[]; index: number; meta?: any };
export type ImagePayload = { type: 'image'; url: string; meta?: any };

export type PreviewPayload = HtmlPayload | SlidesPayload | ImagePayload;
export type LivePayload = PreviewPayload;

/* ---------------- Helper: path builders ---------------------------------------- */
const previewPath = (slot: Slot) => `${PREVIEW_ROOT}/${slot}`;
const livePath    = () => LIVE_ROOT;

/* ---------------- Preview helpers --------------------------------------------- */
export function listenPreviewSlot(
  slot: Slot,
  cb: (value: PreviewPayload | null) => void
): () => void {
  const r = ref(db, previewPath(slot));
  const unsub = onValue(r, (snap) => cb((snap.val() as PreviewPayload) ?? null));
  return () => unsub();
}

export async function setPreviewSlot(slot: Slot, payload: PreviewPayload) {
  await set(ref(db, previewPath(slot)), payload);
}

export async function setPreviewIndex(slot: Slot, index: number) {
  await update(ref(db, previewPath(slot)), { index });
}

export async function clearPreviewSlot(slot: Slot) {
  await remove(ref(db, previewPath(slot)));
}

/* ---------------- Live helpers ------------------------------------------------- */
export function listenLive(cb: (value: LivePayload | null) => void): () => void {
  const r = ref(db, livePath());
  const unsub = onValue(r, (snap) => cb((snap.val() as LivePayload) ?? null));
  return () => unsub();
}

export async function setLiveContent(payload: LivePayload | null) {
  const r = ref(db, livePath());
  if (payload == null) {
    await remove(r);
  } else {
    await set(r, payload);
  }
}

/** Reads the selected preview slot and writes it to the live path. */
export async function copyPreviewToLive(slot: Slot) {
  const snap = await get(ref(db, previewPath(slot)));
  const val = (snap.exists() ? (snap.val() as LivePayload) : null);
  await setLiveContent(val);
}
