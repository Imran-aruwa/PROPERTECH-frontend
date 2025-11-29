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
      <body className={`${inter.className} relative overflow-x-hidden bg-slate-950`}>
        
        {/* 🌈 Animated Background */}
        <div className="fixed inset-0 -z-50 animate-bg-gradient opacity-[0.35]"></div>

        {/* Particles Background */}
        <div className="fixed inset-0 -z-40 opacity-10 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(2px 2px at 20px 30px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 60px 70px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 50px 50px, #ddd, rgba(0,0,0,0))',
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}></div>

        {/* Page Content */}
        {children}
      </body>
    </html>
  )
}