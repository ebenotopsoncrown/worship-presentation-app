// utils/firebase.ts
// Works with Firebase v9 modular API, but keeps v8-style conveniences
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged as _onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  getDatabase,
  ref as _ref,
  onValue as _onValue,
  off as _off,
  set as _set,
  update as _update,
  remove as _remove,
  DatabaseReference,
} from "firebase/database";

/** IMPORTANT: make sure these env vars exist in Vercel project settings */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FB_DB_URL!,   // <- REQUIRED
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FB_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);

/** Back-compat so code that does `auth.onAuthStateChanged(...)` keeps working */
 // @ts-expect-error attach legacy-like method
auth.onAuthStateChanged = (next: any, error?: any, completed?: any) =>
  _onAuthStateChanged(auth, next, error, completed);

/** Wrapper so callers can keep doing `ref("path")` */
export const ref = (path: string): DatabaseReference => _ref(db, path);

/** Re-export these so imports from '../utils/firebase' still work */
export const onValue = _onValue;
export const off = _off;
export const set = _set;
export const update = _update;
export const remove = _remove;

/** App-specific helpers used around the codebase */
export type PreviewPayload = { html?: string; data?: any };

export const setPreviewSlot = async (slot: number, payload: PreviewPayload) => {
  const r = _ref(db, `preview/${slot}`);
  await _set(r, { updatedAt: Date.now(), ...payload });
};

export const listenPreviewSlot = (
  slot: number,
  cb: (value: any) => void
) => {
  const r = _ref(db, `preview/${slot}`);
  const unsub = _onValue(r, (snap) => cb(snap.val()));
  // return an unsubscribe compatible with useEffect cleanups
  return () => _off(r, "value", unsub as any);
};

export const setLive = async (payload: PreviewPayload) => {
  await _set(_ref(db, "live"), { updatedAt: Date.now(), ...payload });
};

export const subscribeToLive = (cb: (value: any) => void) => {
  const r = _ref(db, "live");
  return _onValue(r, (snap) => cb(snap.val()));
};

/** Optional helpers used elsewhere */
export const hymnsRef = () => _ref(db, "hymns");

export const signIn = async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};

export const signOutUser = () => signOut(auth);
