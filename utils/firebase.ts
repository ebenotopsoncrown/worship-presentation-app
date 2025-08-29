// utils/firebase.ts
// Single, safe Firebase bootstrap + RTDB helpers for the app.
//
// IMPORTANT: set these in your environment (Vercel -> Project Settings -> Environment Variables)
// NEXT_PUBLIC_FIREBASE_API_KEY
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
// NEXT_PUBLIC_FIREBASE_DATABASE_URL     <-- use the REGION URL shown in Firebase console
// NEXT_PUBLIC_FIREBASE_PROJECT_ID
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
// NEXT_PUBLIC_FIREBASE_APP_ID

import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  remove,
  get,
  child,
  type Database,
} from 'firebase/database';
import { getAuth, type Auth } from 'firebase/auth';

// ---------- Bootstrap ----------
function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    // Throwing here gives a clear error in Vercel builds if a var is missing
    throw new Error(`Missing env: ${name}`);
  }
  return v;
}

// NOTE: Please make sure DATABASE_URL is the *regioned* URL like:
// https://<your-db>-default-rtdb.europe-west1.firebasedatabase.app
// not the legacy https://<your-db>-default-rtdb.firebaseio.com
const firebaseConfig = {
  apiKey: required('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: required('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  databaseURL: required('NEXT_PUBLIC_FIREBASE_DATABASE_URL'),
  projectId: required('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: required('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: required('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: required('NEXT_PUBLIC_FIREBASE_APP_ID'),
};

const app: FirebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
export const db: Database = getDatabase(app);
export const auth: Auth = getAuth(app);

// Re-export RTDB helpers so consumers can import from '../utils/firebase'
export { ref, onValue, set, update, remove, get, child };
// Alias used by some files in your repo
export const dbRef = ref;

// ---------- Types ----------
export type Slot = 1 | 2 | 3 | 4;

type SimplePayload = {
  type: 'text' | 'html' | 'image';
  content: string;
  meta?: Record<string, unknown>;
};

type SlidesPayload = {
  kind: 'slides';
  slides: string[];
  index: number; // current slide
  meta?: Record<string, unknown>;
};

export type PreviewPayload = SimplePayload | SlidesPayload;
export type LivePayload = PreviewPayload;

// ---------- Paths ----------
const PREVIEW_BASE = 'previews';
const LIVE_PATH = 'live';

// ---------- Helpers ----------
function previewPath(slot: Slot) {
  return `${PREVIEW_BASE}/${slot}`;
}

function normalizePreviewPayload(p: any): PreviewPayload {
  // Accept both your existing shapes
  if (p && p.kind === 'slides' && Array.isArray(p.slides)) return p as SlidesPayload;
  if (p && (p.type === 'text' || p.type === 'html' || p.type === 'image')) return p as SimplePayload;
  // Fallback prevents runtime errors if data is malformed
  return { type: 'text', content: '' };
}

// Set/clear a preview slot
export async function setPreviewSlot(slot: Slot, payload: PreviewPayload): Promise<void> {
  await set(ref(db, previewPath(slot)), payload);
}

export async function clearPreviewSlot(slot: Slot): Promise<void> {
  await remove(ref(db, previewPath(slot)));
}

// Listen to a preview slot (unsubscribe returned)
export function listenPreviewSlot(
  slot: Slot,
  cb: (value: PreviewPayload | null) => void
): () => void {
  const r = ref(db, previewPath(slot));
  const unsub = onValue(r, (snap) => {
    cb(snap.exists() ? normalizePreviewPayload(snap.val()) : null);
  });
  return unsub;
}

// Copy preview to live
export async function copyPreviewToLive(slot: Slot): Promise<void> {
  const snap = await get(ref(db, previewPath(slot)));
  const val = snap.exists() ? normalizePreviewPayload(snap.val()) : null;
  if (val) await set(ref(db, LIVE_PATH), val);
}

// Set/listen live
export async function setLive(payload: LivePayload): Promise<void> {
  await set(ref(db, LIVE_PATH), payload);
}

export function listenLive(cb: (value: LivePayload | null) => void): () => void {
  const r = ref(db, LIVE_PATH);
  const unsub = onValue(r, (snap) => {
    cb(snap.exists() ? (normalizePreviewPayload(snap.val()) as LivePayload) : null);
  });
  return unsub;
}
