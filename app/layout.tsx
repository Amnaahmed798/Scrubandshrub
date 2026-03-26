import type { Metadata } from 'next'
import '../styles/globals.css'
import Navbar from '@/components/Navbar'
import Providers from './providers'
import SessionWarningModal from '@/components/SessionWarningModal'
import { I18nProvider } from '@/lib/i18n';
import MobileLayout from './components/layout/mobile-layout';

export const metadata: Metadata = {
  title: 'Sandpiper Car Wash - Professional Cleaning Services',
  description: 'Book professional car wash, house cleaning, and gardening services at your doorstep',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sandpiper',
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: '#fbbf24',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#fbbf24" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sandpiper" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </head>
      <body className="antialiased">
        <Providers>
          <I18nProvider>
            <MobileLayout>
              <Navbar />
              <main className="pt-16">
                {children}
              </main>
              <SessionWarningModal />
            </MobileLayout>
          </I18nProvider>
        </Providers>
      </body>
    </html>
  )
}