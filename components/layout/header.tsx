'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function Header({ onShowLogin, onShowSignup }: {
  onShowLogin?: () => void
  onShowSignup?: () => void
}) {
  const pathname = usePathname()
  const isLanding = pathname === '/'

  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-bold text-xl text-blue-700">PROPERTECH</Link>
        <nav className="flex items-center gap-3">
          {isLanding ? (
            <>
              <Button variant="ghost" onClick={onShowLogin}>Log in</Button>
              <Button variant="primary" onClick={onShowSignup}>Sign up</Button>
            </>
          ) : (
            <>
              <Link href="/auth/login"><Button variant="ghost">Log in</Button></Link>
              <Link href="/auth/signup"><Button variant="primary">Sign up</Button></Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
