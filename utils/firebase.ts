/// utils/firebase.ts
import { initializeApp, getApp, getApps, type FirebaseOptions } from 'firebase/app'
import { getDatabase, ref, set, onValue, get, update } from 'firebase/database'
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth'

// Read from env vars (set in .env.local and Vercel → Settings → Environment Variables)
const cfg: FirebaseOptions = {
  apiKey: 'AIzaSyAqbORGv22jFVblz05CtrXffZSKKwYeWys',
  authDomain: 'worship-presentation.firebaseapp.com',
  databaseURL: 'https://worship-presentation-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'worship-presentation',
  storageBucket: 'worship-presentation.firebasestorage.app',
  messagingSenderId: '282827808544',
  appId: '1:282827808544:web:056ad57a65bd003a2bc145',
}

// Avoid re-initializing in hot reload
const app = getApps().length ? getApp() : initializeApp(cfg)
const db = getDatabase(app)
const auth = getAuth(app)

export {
  db, ref, set, onValue, get, update,
  auth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail
}