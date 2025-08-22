// utils/firebase.ts
import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app';
import {
  getDatabase, ref as _ref, set as _set, onValue, off, get, update, type DataSnapshot,
} from 'firebase/database';
import {
  getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
} from 'firebase/auth';
import {
  getStorage, ref as sref, uploadBytes, getDownloadURL, type UploadResult,
} from 'firebase/storage';

// ---- CONFIG (all NEXT_PUBLIC_* must exist in Vercel) ----
const cfg: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,  // required for RTDB
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // optional but needed for uploads
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApps()[0] : initializeApp(cfg);

export const db = getDatabase(app);
export const auth = getAuth(app);

// Storage (gracefully optional)
let storage: ReturnType<typeof getStorage> | null = null;
try { storage = getStorage(app); }
catch { console.warn('[firebase] Storage not configured; slide uploads will fall back to data URLs.'); }

export const dbRef = _ref;
export const set = _set;
export { onValue, off, get, update, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut, sendPasswordResetEmail };

// Diagnostics
export function subscribeConnected(handler?: (connected: boolean) => void) {
  const r = dbRef(db, '.info/connected');
  const unsub = onValue(r, s => handler?.(!!s.val()), err => console.error('[firebase] .info/connected error:', err));
  return typeof unsub === 'function' ? unsub : () => off(r);
}

// ---------- PREVIEW SLOTS ----------
export async function setPreviewSlot(
  slot: number,
  payload: { id: string; kind: 'workspace'|'hymn'|'bible'|'slides'; title?: string; html?: string; lines?: string[] }
) {
  const path = `preview_slots/slot${slot}`;
  const ref = dbRef(db, path);
  await _set(ref, payload);
}

export function subscribeToPreviewSlot(
  slot: number,
  handler: (value: any | null, snap: DataSnapshot) => void,
  onError?: (err: any) => void
): () => void {
  const ref = dbRef(db, `preview_slots/slot${slot}`);
  const unsub = onValue(ref, s => handler(s.val() ?? null, s), e => onError?.(e));
  return typeof unsub === 'function' ? unsub : () => off(ref);
}

// ---------- LIVE CONTENT ----------
export async function setLiveContent(
  payload: { id: string; from: 'workspace'|'hymn'|'bible'|'slides'; title?: string; html?: string; lines?: string[] }
) {
  await _set(dbRef(db, 'live_content'), payload);
}

export function subscribeToLive(
  handler: (value: any | null, snap: DataSnapshot) => void,
  onError?: (err: any) => void
): () => void {
  const ref = dbRef(db, 'live_content');
  const unsub = onValue(ref, s => handler(s.val() ?? null, s), e => onError?.(e));
  return typeof unsub === 'function' ? unsub : () => off(ref);
}

// ---------- STORAGE: slide image upload ----------
export async function uploadSlideImage(file: File, path?: string): Promise<string> {
  if (!storage) throw new Error('storage-not-configured');
  const p = path ?? `slides/${Date.now()}-${file.name}`;
  const r = sref(storage, p);
  const snap: UploadResult = await uploadBytes(r, file, { contentType: file.type });
  return await getDownloadURL(snap.ref);
}
