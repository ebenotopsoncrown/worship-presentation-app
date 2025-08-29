// pages/_app.tsx
import type { AppProps } from 'next/app';

// Minimal, safe app wrapper. No auth, no router, no side-effects.
export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}


