import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/app/lib/auth-context'

const inter = Inter({ subsets: ['latin'] })

/* ✅ CENTRALIZED BRAND METADATA */
export const metadata: Metadata = {
  title: {
    default: 'Propertech Software',
    template: '%s | Propertech Software',
  },
  description:
    'Smarter property management software for landlords, agents, and property managers. Manage properties, tenants, payments, and maintenance from one modern platform.',
  keywords: [
    'property management software',
    'real estate management',
    'landlord software',
    'tenant management',
    'property management Kenya',
    'real estate software Africa',
  ],
  metadataBase: new URL('https://propertechsoftware.com'),
  openGraph: {
    title: 'Propertech Software',
    description:
      'Smarter property management, anywhere. Manage properties, tenants, payments, and maintenance with ease.',
    url: 'https://propertechsoftware.com',
    siteName: 'Propertech Software',
    images: ['/og-image.png'], // ✅ place this in /public later
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProperTech Software',
    description:
      'Smarter property management software for landlords and agents.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.png', // ✅ place this in /public
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

/* ✅ VIEWPORT CONFIG (NEXT.JS 13+ BEST PRACTICE) */
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#020617', // slate-950
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} relative overflow-x-hidden bg-slate-950 text-white`}
      >
        {/* 🌈 Animated Gradient Background */}
        <div className="fixed inset-0 -z-50 animate-bg-gradient opacity-[0.35]" />

        {/* ✨ Subtle Particles */}
        <div
          className="fixed inset-0 -z-40 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(2px 2px at 20px 30px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 60px 70px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 50px 50px, #ddd, rgba(0,0,0,0))',
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 200px',
          }}
        />

        {/* ✅ AUTH CONTEXT (DO NOT REMOVE) */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
