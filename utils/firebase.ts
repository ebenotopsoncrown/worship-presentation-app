// utils/firebase.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import {
  getDatabase,
  ref as rtdbRef,
  onValue,
  off,
  set,
  update,
  push,
  DatabaseReference,
} from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

/**
 * Read all config from env. Add NEXT_PUBLIC_FIREBASE_DATABASE_URL in Vercel.
 * (Find it in Firebase console → Realtime Database → Data → Instance URL)
 */
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const databaseURL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  (projectId
    ? // fallback if you didn’t set DATABASE_URL env
      // you can use .firebasedatabase.app or .firebaseio.com; both work
      `https://${projectId}-default-rtdb.firebaseio.com`
    : undefined);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL, // <- important for SSR/build
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Services
const auth = getAuth(app);
const db = getDatabase(app, databaseURL);
const storage = getStorage(app);

/** ---------------------------
 * Realtime Database helpers
 * --------------------------*/

// keep the symbol name `ref` because your pages import it as { ref }
export const ref = (path: string): DatabaseReference => rtdbRef(db, path);
// also export dbRef for any places that import that name
export const dbRef = (path: string): DatabaseReference => rtdbRef(db, path);

// pass-through ops your code already uses
export { onValue, off, set, update, push };

/** App-specific paths/helpers used around the UI */
export const previewRef = (slot: number) => rtdbRef(db, `previews/${slot}`);
export const liveRef = () => rtdbRef(db, "live");
export const previewSlotRef = () => rtdbRef(db, "ui/previewSlot");

/** Some parts of the UI import this; make it write the chosen slot */
export const setPreviewSlot = async (slot: number) => set(previewSlotRef(), slot);

/** ---------------------------
 * Storage helpers
 * --------------------------*/

// Wrapper so you don’t need to import (nonexistent) refFromURL
export const storageRefFromURL = (urlOrPath: string) => storageRef(storage, urlOrPath);
export const storageRootRef = (path = "") => storageRef(storage, path);
export { uploadBytes, getDownloadURL, deleteObject };

/** ---------------------------
 * Auth helpers (used in Login)
 * --------------------------*/
export { auth, signInWithEmailAndPassword, sendPasswordResetEmail, signOut };

// default export in case anything else expects it
export default app;
