'use client';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { auth } from '../utils/firebase';
import '../styles/globals.css'; // keep your globals if you have them

export default function MyApp({ Component, pageProps }: AppProps) {
  // Optional: keep an auth listener, but never block rendering on it
  useEffect(() => {
    if (auth?.onAuthStateChanged) {
      const off = auth.onAuthStateChanged(() => {});
      return () => (typeof off === 'function' ? off() : undefined);
    }
  }, []);
  return <Component {...pageProps} />;
}
