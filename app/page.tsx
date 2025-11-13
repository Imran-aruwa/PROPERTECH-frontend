'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Head from 'next/head'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import Button from '@/components/ui/Button'
import { LogOut, Settings, Home, Users, DollarSign, Wrench, BarChart3, Sparkles } from 'lucide-react'

interface User {
  id: string
  email: string
  role?: string
}

interface UserProfile {
  id: string
  email: string
  role: string
  created_at?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signOutLoading, setSignOutLoading] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw new Error(sessionError.message)
        }

        if (!session?.user) {
          router.push('/auth/login')
          return
        }

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, email, role, created_at')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Profile fetch error:', profileError)
          // Create profile if it doesn't exist
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              {
                id: session.user.id,
                email: session.user.email,
                role: 'user',
                created_at: new Date(),
              },
            ])

          if (insertError && !insertError.message.includes('duplicate')) {
            throw new Error('Failed to create user profile')
          }

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: 'user',
          })
        } else {
          setUser(profile as UserProfile)
        }
      } catch (err) {
        console.error('Auth check error:', err)
        setError('Failed to load user data')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleSignOut = async () => {
    setSignOutLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/auth/login')
    } catch (err) {
      console.error('Sign out error:', err)
      setError('Failed to sign out')
      setSignOutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/auth/login')} variant="primary">
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isAdmin = user.role === 'admin'

  const dashboardModules = [
    {
      icon: Home,
      title: 'Property Portfolio',
      description: 'Manage all your properties in one place',
      href: '/dashboard/portfolio',
    },
    {
      icon: Users,
      title: 'Tenant Hub',
      description: 'Manage tenants and leases',
      href: '/dashboard/tenants',
    },
    {
      icon: DollarSign,
      title: 'Finance',
      description: 'Track income and expenses',
      href: '/dashboard/finance',
    },
    {
      icon: Wrench,
      title: 'Maintenance',
      description: 'Manage maintenance requests',
      href: '/dashboard/maintenance',
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'View reports and insights',
      href: '/dashboard/analytics',
    },
    {
      icon: Sparkles,
      title: 'AI Assistant',
      description: 'Ask questions about your properties',
      href: '/dashboard/ai-assistant',
    },
  ]

  return (
    <>
      <Head>
        <title>Dashboard — Propertech</title>
        <meta name="description" content="Your property management dashboard" />
      </Head>

      <Header />

      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.email}</h1>
              <p className="text-gray-600 mt-1">
                {isAdmin ? 'Admin Dashboard' : 'Your Property Management Hub'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/dashboard/settings')}
                variant="ghost"
                className="flex items-center gap-2"
              >
                <Settings className="w-5 h-5" />
                Settings
              </Button>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="flex items-center gap-2"
                disabled={signOutLoading}
              >
                <LogOut className="w-5 h-5" />
                {signOutLoading ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>
          </div>

          {/* Admin Waitlist Section */}
          {isAdmin && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h2 className="font-semibold text-blue-900">Admin Panel</h2>
                  <p className="text-blue-700 text-sm mt-1">
                    You have admin access. View waitlist and system analytics.
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/dashboard/waitlist')}
                  variant="primary"
                  className="whitespace-nowrap"
                >
                  Go to Waitlist
                </Button>
              </div>
            </div>
          )}

          {/* Dashboard Modules Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardModules.map((module) => {
              const Icon = module.icon
              return (
                <button
                  key={module.title}
                  onClick={() => router.push(module.href)}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition text-left group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900">{module.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{module.description}</p>
                </button>
              )
            })}
          </div>

          {/* Quick Stats Section */}
          <div className="grid md:grid-cols-4 gap-6 mt-12">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-2">Total Properties</div>
              <div className="text-3xl font-bold text-gray-900">0</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-2">Active Tenants</div>
              <div className="text-3xl font-bold text-gray-900">0</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-2">Monthly Revenue</div>
              <div className="text-3xl font-bold text-gray-900">KES 0</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-2">Open Requests</div>
              <div className="text-3xl font-bold text-gray-900">0</div>
            </div>
          </div>

          {/* Empty State Message */}
          <div className="mt-12 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-8 text-center">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Started</h3>
            <p className="text-gray-600 mb-6">
              Start by adding your first property to begin managing your portfolio.
            </p>
            <Button onClick={() => router.push('/dashboard/portfolio')} variant="primary">
              Add Your First Property
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}