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

const cfg: FirebaseOptions = {
  apiKey: AIzaSyAqbORGv22jFVblz05CtrXffZSKKwYeWys,
  authDomain: worship-presentation.firebaseapp.com,
  databaseURL: https://worship-presentation-default-rtdb.europe-west1.firebasedatabase.app, // optional is fine
  projectId: worship-presentation,
  storageBucket: worship-presentation.appspot.com,
  messagingSenderId: 282827808544,
  appId: 1:282827808544:web:056ad57a65bd003a2bc145,
}

const app = getApps().length ? getApps()[0] : initializeApp(cfg)

export const db = getDatabase(app)
export const auth = getAuth(app)

// DB helpers
export const dbRef = _ref
export { set, onValue, get, update }

// Auth helpers (so you can import from here)
export { signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail }
