import '../styles/globals.css';
import { HeroUIProvider } from '@heroui/react';
import { AppProps } from 'next/app';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <HeroUIProvider>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </HeroUIProvider>
  );
}

