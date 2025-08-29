// pages/_app.tsx
import type { AppProps } from 'next/app';
import '../styles/globals.css'; // keep if you have global css; otherwise remove

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
