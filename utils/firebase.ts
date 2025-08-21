// utils/firebase.ts
import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app'
import {
  getDatabase,
  ref as _ref,
  set,
  onValue,
  get,
  update,
} from 'firebase/database'
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth'

// Use ENV so secrets aren't in git
const cfg: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

// Avoid double-init in dev/hot-reload
const app = getApps().length ? getApps()[0] : initializeApp(cfg)

// Primary handles
export const db = getDatabase(app)
export const auth = getAuth(app)

// ---- DB helpers ----
export const dbRef = _ref
export { set, onValue, get, update }

// Write to a preview slot and surface errors in console/UI
export async function setPreviewSlot(
  slot: number,
  payload: { id: string; kind: 'workspace'|'hymn'|'bible'; title?: string; html?: string; lines?: string[] }
) {
  const path = `preview_slots/slot${slot}`;
  try {
    await set(dbRef(db, path), payload);
  } catch (err) {
    console.error('setPreviewSlot failed:', path, err);
    throw err; // let the caller show a message if desired
  }
}


// ---- Auth helpers ----
export {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
}

// ---- Compatibility: allow `import { ref } ...`
export { _ref as ref }
