// utils/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase, ref, onValue, set, update, remove,
  DataSnapshot, Unsubscribe,
} from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getDatabase(app);

export type HtmlPayload   = { kind?: 'html';   html: string;  meta?: any };
export type SlidesPayload = { kind: 'slides';  slides: string[]; index?: number; meta?: any };
export type PreviewPayload = HtmlPayload | SlidesPayload | null;

export const liveRef    = () => ref(db, 'live_content');
export const previewRef = (slot: number) => ref(db, `preview_slots/${slot}`);

export function listenLiveContent(
  cb: (v: { html: string; meta?: any } | null, snap?: DataSnapshot) => void
): Unsubscribe {
  return onValue(liveRef(), (snap) => cb(snap.val(), snap));
}

export function listenPreviewSlot(
  slot: number,
  cb: (v: PreviewPayload, snap?: DataSnapshot) => void
): Unsubscribe {
  return onValue(previewRef(slot), (snap) => cb(snap.val(), snap));
}

export async function setLiveContent(payload: { html: string; meta?: any }) {
  await set(liveRef(), payload);
}
export async function clearLiveContent() { await remove(liveRef()); }

export async function setPreviewSlot(slot: number, payload: HtmlPayload | SlidesPayload) {
  await set(previewRef(slot), payload);
}
export async function updatePreviewSlot(slot: number, patch: Partial<SlidesPayload & HtmlPayload>) {
  await update(previewRef(slot), patch as any);
}
export async function clearPreviewSlot(slot: number) { await set(previewRef(slot), null); }
export async function setPreviewIndex(slot: number, index: number) {
  await update(previewRef(slot), { index });
}

export async function pushSlidesToPreview(slot: number, slides: string[], meta?: any, startIndex = 0) {
  await setPreviewSlot(slot, { kind: 'slides', slides, index: startIndex, meta });
}

export async function pushLiveFromPreview(slot: number, index?: number) {
  return new Promise<void>((resolve, reject) => {
    const unsub = onValue(previewRef(slot), async (snap) => {
      try {
        const val = snap.val() as PreviewPayload;
        if (!val) return resolve(unsub());
        if ((val as SlidesPayload).slides) {
          const p = val as SlidesPayload;
          const i = typeof index === 'number' ? index : (p.index ?? 0);
          const html = p.slides[i] ?? '';
          await setLiveContent({ html, meta: { fromPreview: slot, index: i, total: p.slides.length } });
        } else if ((val as HtmlPayload).html) {
          await setLiveContent({ html: (val as HtmlPayload).html, meta: { fromPreview: slot } });
        }
        resolve(unsub());
      } catch (e) { reject(e); }
    }, { onlyOnce: true });
  });
}
