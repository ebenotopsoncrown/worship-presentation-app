// utils/firebase.ts
// Single source of truth for Firebase (App, Auth, RTDB, helpers)

import { initializeApp, getApps } from 'firebase/app';
import {
  getDatabase,
  ref as rtdbRef,
  onValue,
  get,
  set,
  update,
  child,
  type Database,
  type Reference,
} from 'firebase/database';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth';

// ----- ENV CONFIG -----
// Make sure ALL of these are defined on Vercel and locally (.env.local)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  // IMPORTANT: must be the regioned URL you saw in the console warning.
  // Example: https://worship-presentation-default-rtdb.europe-west1.firebasedatabase.app
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Initialize once
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Core services
export const db = getDatabase(app);
export const auth = getAuth(app);

// Re-export RTDB helpers EXACTLY as your components expect
// so calls like ref(db, 'hymns') keep working.
export {
  onValue,
  get,
  set,
  update,
  child,
};

// Re-export a `ref` function that proxies to the RTDB ref.
// (Do NOT rename; components import { ref } directly from this module.)
export function ref(dbOrRef: Database | Reference, path?: string): Reference {
  // @ts-expect-error: pass-through to the overloaded SDK ref
  return rtdbRef(dbOrRef, path);
}

// ----- Auth helpers -----
export function onAuth(cb: Parameters<typeof onAuthStateChanged>[1]) {
  return onAuthStateChanged(auth, cb);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}

export async function signOut() {
  await fbSignOut(auth);
}

// ----- Preview / Live helpers -----
// Slots 1..4 (adjust if you later add more)
export type Slot = 1 | 2 | 3 | 4;

export type PreviewPayload =
  | { type: 'text';  content: string; meta?: any }
  | { type: 'html';  content: string; meta?: any }
  | { type: 'image'; content: string; meta?: any } // dataURL or public URL
  | { type: 'slides'; slides: string[]; index?: number; meta?: any };

function slotPath(slot: Slot) {
  return `previews/${slot}`;
}

/** Write to a preview slot */
export async function setPreviewSlot(slot: Slot, payload: PreviewPayload) {
  await set(rtdbRef(db, slotPath(slot)), {
    ...payload,
    updatedAt: Date.now(),
  });
}

/** Subscribe to a preview slot; returns unsubscribe */
export function listenPreviewSlot(
  slot: Slot,
  cb: (value: any | null) => void
) {
  const r = rtdbRef(db, slotPath(slot));
  const unsub = onValue(r, (snap) => cb(snap.val() ?? null));
  return unsub; // call to stop listening
}

/** Clear a preview slot */
export async function clearPreviewSlot(slot: Slot) {
  await set(rtdbRef(db, slotPath(slot)), null);
}

/** Copy a preview slot to /live/current (used by “Go Live”) */
export async function goLiveFromSlot(slot: Slot) {
  const src = await get(rtdbRef(db, slotPath(slot)));
  const val = src.val();
  await set(rtdbRef(db, 'live/current'), val ?? null);
}
