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
  type Database,
  type DatabaseReference,
} from "firebase/database";

const isBrowser = typeof window !== "undefined";

/** ---- Config from env (Vercel → Settings → Environment Variables) ---- */
const projectId = process.env.NEXT_PUBLIC_FB_PROJECT_ID || "";
const databaseURLFromEnv = process.env.NEXT_PUBLIC_FB_DB_URL;

/**
 * Fallback: if you haven’t provided NEXT_PUBLIC_FB_DB_URL,
 * try the default namespace URL derived from the projectId.
 * (Better: set NEXT_PUBLIC_FB_DB_URL exactly as shown in Firebase console.)
 */
const derivedDbUrl = projectId
  ? `https://${projectId}-default-rtdb.firebaseio.com`
  : undefined;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN || "",
  databaseURL: databaseURLFromEnv || derivedDbUrl, // <-- important
  projectId,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FB_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FB_APP_ID || "",
};

/** ---- Core app ---- */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/** ---- Lazy DB getter (prevents SSR/build crash if DB URL missing) ---- */
let _db: Database | null = null;
const getDb = (): Database => {
  if (!_db) {
    // If databaseURL is not provided, getDatabase() will throw.
    // Lazy init means we only call this on the client at runtime.
    _db = getDatabase(app);
  }
  return _db;
};

/** Re-export helpers, resolving DB lazily */
export const ref = (path: string): DatabaseReference => _ref(getDb(), path);
/** Back-compat for modules that import { dbRef } */
export const dbRef = ref;

export const onValue = _onValue;
export const off = _off;
export const set = _set;
export const update = _update;
export const remove = _remove;

/** ---- Auth: real on client, harmless shim on server ---- */
let _auth: ReturnType<typeof getAuth> | null = null;
if (isBrowser) {
  _auth = getAuth(app);
  // v8-style signature used in your code: auth.onAuthStateChanged(...)
  (_auth as any).onAuthStateChanged = (next: any, error?: any, completed?: any) =>
    _onAuthStateChanged(_auth!, next, error, completed);
}
export const auth: any = _auth || ({ onAuthStateChanged: () => {} } as any);

/** ---- App-specific helpers ---- */
export type PreviewPayload = { html?: string; data?: any };

export const setPreviewSlot = async (slot: number, payload: PreviewPayload) => {
  await _set(_ref(getDb(), `preview/${slot}`), { updatedAt: Date.now(), ...payload });
};

export const listenPreviewSlot = (slot: number, cb: (value: any) => void) => {
  const r = _ref(getDb(), `preview/${slot}`);
  const unsub = _onValue(r, (snap) => cb(snap.val()));
  return () => _off(r, "value", unsub as any);
};

export const setLive = async (payload: PreviewPayload) => {
  await _set(_ref(getDb(), "live"), { updatedAt: Date.now(), ...payload });
};

export const subscribeToLive = (cb: (value: any) => void) => {
  const r = _ref(getDb(), "live");
  return _onValue(r, (snap) => cb(snap.val()));
};

export const hymnsRef = () => _ref(getDb(), "hymns");

export const signIn = async () => {
  if (!isBrowser) return;
  const provider = new GoogleAuthProvider();
  await signInWithPopup(getAuth(app), provider);
};

export const signOutUser = () => {
  if (!isBrowser) return;
  return signOut(getAuth(app));
};
