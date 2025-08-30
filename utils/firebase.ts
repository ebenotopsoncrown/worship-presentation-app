// utils/firebase.ts
'use client';

/**
 * Centralized Firebase client (App Router / Next.js compatible)
 * - Initializes the app exactly once
 * - Exposes Auth + RTDB instances
 * - Re-exports the modular helpers you use across the app
 * - Adds small, typed helpers for previews & live payloads
 */

import { initializeApp, getApp, getApps } from 'firebase/app';

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  type Auth,
} from 'firebase/auth';

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

/* ------------------------------------------------------------------ */
/* Configuration / initialization                                      */
/* ------------------------------------------------------------------ */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL, // <- keep set to your region URL
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/** Firebase Auth + RTDB singletons */
export const auth: Auth = getAuth(app);
/**
 * Pass the explicit DB URL (when provided) to avoid region warnings.
 * If NEXT_PUBLIC_FIREBASE_DATABASE_URL is undefined, getDatabase(app) still works.
 */
export const db: Database = firebaseConfig.databaseURL
  ? getDatabase(app, firebaseConfig.databaseURL)
  : getDatabase(app);

/* ------------------------------------------------------------------ */
/* Re-exports for convenience (what your code already imports)         */
/* ------------------------------------------------------------------ */

// RTDB helpers
export { ref, onValue, set, update, remove, get, child };

// Auth helpers used across the app (fixes Vercel error)
export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
};

/* ------------------------------------------------------------------ */
/* Shared types and helpers used by the app                            */
/* ------------------------------------------------------------------ */

/** Numbered preview slots in your UI */
export type Slot = 1 | 2 | 3 | 4;
export const SLOT_COUNT = 4;

/** Preview / live payloads */
export type HtmlPayload = { type: 'html'; content: string };
export type SlidesPayload = { kind: 'slides'; slides: string[]; index?: number };
export type PreviewPayload = HtmlPayload | SlidesPayload;
export type LivePayload = PreviewPayload | null;

const slotPath = (slot: Slot) => `previews/${slot}`;

/* ------------------------------ Previews --------------------------- */

/** Write a payload into a preview slot */
export function setPreviewSlot(slot: Slot, payload: PreviewPayload) {
  return set(ref(db, slotPath(slot)), payload);
}

/** Update only the index inside a slides payload for a slot */
export function setPreviewIndex(slot: Slot, index: number) {
  return update(ref(db, slotPath(slot)), { index });
}

/** Remove/clear a preview slot */
export function clearPreviewSlot(slot: Slot) {
  return remove(ref(db, slotPath(slot)));
}

/**
 * Subscribe to a preview slot. Returns an unsubscribe function.
 * Usage:
 *   const off = listenPreviewSlot(1, v => { ... });
 *   // later
 *   off();
 */
export function listenPreviewSlot(
  slot: Slot,
  cb: (payload: PreviewPayload | null) => void
): () => void {
  const r = ref(db, slotPath(slot));
  return onValue(r, (snap) => {
    cb(snap.exists() ? (snap.val() as PreviewPayload) : null);
  });
}

/** Copy a preview slot's value to /live */
export async function copyPreviewToLive(slot: Slot) {
  const root = ref(db);
  const snap = await get(child(root, slotPath(slot)));
  return set(ref(db, 'live'), snap.exists() ? snap.val() : null);
}

/* ------------------------------- Live ------------------------------ */

/** Set /live payload directly */
export function setLiveContent(payload: LivePayload) {
  return set(ref(db, 'live'), payload);
}

/** Subscribe to /live. Returns unsubscribe. */
export function subscribeToLive(cb: (value: LivePayload) => void): () => void {
  const r = ref(db, 'live');
  return onValue(r, (snap) => {
    cb(snap.exists() ? (snap.val() as LivePayload) : null);
  });
}
