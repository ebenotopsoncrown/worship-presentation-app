// utils/firebase.ts
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

const isBrowser = typeof window !== "undefined";

/** Make sure ALL of these are set in Vercel (Project Settings → Environment Variables) */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FB_DB_URL!,   // required
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FB_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getDatabase(app);

/** SSR-safe auth: real instance on client, harmless shim on server */
let _authInst: ReturnType<typeof getAuth> | null = null;
const ensureAuth = () => {
  if (!isBrowser) return null;
  if (!_authInst) _authInst = getAuth(app);
  return _authInst;
};

type AuthShim = { onAuthStateChanged: (..._args: any[]) => any };
export const auth: any = isBrowser
  ? ensureAuth()
  : ({ onAuthStateChanged: () => {} } as AuthShim);

// v8-style compatibility: auth.onAuthStateChanged(...)
if (isBrowser && auth) {
  (auth as any).onAuthStateChanged = (next: any, error?: any, completed?: any) =>
    _onAuthStateChanged(auth, next, error, completed);
}

/** Re-export database helpers with expected names */
export const ref = (path: string): DatabaseReference => _ref(db, path);
export const onValue = _onValue;
export const off = _off;
export const set = _set;
export const update = _update;
export const remove = _remove;

/** App-specific helpers */
export type PreviewPayload = { html?: string; data?: any };

export const setPreviewSlot = async (slot: number, payload: PreviewPayload) => {
  await _set(_ref(db, `preview/${slot}`), { updatedAt: Date.now(), ...payload });
};

export const listenPreviewSlot = (slot: number, cb: (value: any) => void) => {
  const r = _ref(db, `preview/${slot}`);
  const unsub = _onValue(r, (snap) => cb(snap.val()));
  return () => _off(r, "value", unsub as any);
};

export const setLive = async (payload: PreviewPayload) => {
  await _set(_ref(db, "live"), { updatedAt: Date.now(), ...payload });
};

export const subscribeToLive = (cb: (value: any) => void) => {
  const r = _ref(db, "live");
  return _onValue(r, (snap) => cb(snap.val()));
};

export const hymnsRef = () => _ref(db, "hymns");

export const signIn = async () => {
  if (!isBrowser) return;
  const provider = new GoogleAuthProvider();
  await signInWithPopup(ensureAuth()!, provider);
};

export const signOutUser = () => {
  if (!isBrowser) return;
  return signOut(ensureAuth()!);
};
