// utils/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import {
  getDatabase,
  ref as dbRef,
  onValue,
  set,
  get,
  remove,
} from 'firebase/database';

/** IMPORTANT: make sure this URL matches your regional RTDB URL, e.g.
 * https://worship-presentation-default-rtdb.europe-west1.firebasedatabase.app
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DB_URL!, // <- must be set
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { dbRef, onValue };

export type Slot = 1 | 2 | 3 | 4;

export type PreviewPayload =
  | { type: 'html'; content: string; meta?: Record<string, any> }
  | { type: 'text'; content: string; meta?: Record<string, any> }
  | { type: 'image'; content: string; meta?: Record<string, any> } // URL or data URL
  | { type: 'slides'; slides: string[]; index: number; meta?: Record<string, any> };

function slotPath(slot: Slot) {
  return `previews/${slot}`;
}

/** Write a preview slot */
export async function setPreviewSlot(slot: Slot, payload: PreviewPayload) {
  await set(dbRef(db, slotPath(slot)), { ...payload, _ts: Date.now() });
}

/** Listen to a preview slot */
export function listenPreviewSlot(
  slot: Slot,
  cb: (v: PreviewPayload | null) => void
) {
  return onValue(dbRef(db, slotPath(slot)), s =>
    cb((s.val() as PreviewPayload) ?? null)
  );
}

/** Clear a preview slot */
export async function clearPreviewSlot(slot: Slot) {
  await remove(dbRef(db, slotPath(slot)));
}

/** Listen to "live" */
export function listenLive(cb: (v: PreviewPayload | null) => void) {
  return onValue(dbRef(db, 'live'), s =>
    cb((s.val() as PreviewPayload) ?? null)
  );
}

/** Set "live" directly */
export async function setLive(payload: PreviewPayload) {
  await set(dbRef(db, 'live'), { ...payload, _ts: Date.now() });
}

/** Copy a preview slot to "live" */
export async function goLiveFromSlot(slot: Slot) {
  const snap = await get(dbRef(db, slotPath(slot)));
  const val = snap.val();
  if (val) {
    await set(dbRef(db, 'live'), { ...val, _ts: Date.now() });
  } else {
    await remove(dbRef(db, 'live'));
  }
}

/** Backwards alias if any code imports `goLive` */
export const goLive = goLiveFromSlot;
