import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
// import { SyncProvider } from '@/components/providers/sync-provider';
import { SafariInstallPrompt } from '@/components/pwa';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Infinity Tournament Manager',
    template: '%s | ITM',
  },
  description:
    'Manage and participate in Infinity the Game tournaments. Swiss pairings, ITS scoring, and real-time standings.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ITM',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Infinity Tournament Manager',
    title: 'Infinity Tournament Manager',
    description:
      'The complete platform for organizing and participating in Infinity the Game tournaments.',
  },
  twitter: {
    card: 'summary',
    title: 'Infinity Tournament Manager',
    description:
      'Manage and participate in Infinity the Game tournaments.',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <Providers>
          {/* SyncProvider disabled - causes slow loads by fetching all data on init */}
          {/* TODO: Re-enable only in /dashboard layout when offline support needed */}
          {children}
          <Toaster />
          <SafariInstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
