import type { AppProps } from 'next/app';
import '../styles/globals.css';
import AppHeader from '../components/AppHeader';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <AppHeader />
      <Component {...pageProps} />
    </>
  );
}
