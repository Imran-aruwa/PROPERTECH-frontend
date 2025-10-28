import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PROPERTECH - Smarter Property Management, Anywhere',
  description: 'Modern property management software for landlords and property managers. Manage properties, tenants, finances, and maintenance from one beautiful dashboard.',
  keywords: 'property management, landlord software, tenant management, real estate software',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}