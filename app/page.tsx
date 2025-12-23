'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/lib/auth-context'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

const featuresData = [
  { key: 'portfolio', title: 'Property Portfolio', description: 'Centralized dashboard for all your properties. Track occupancy, manage units, and visualize your entire portfolio at a glance.' },
  { key: 'tenant', title: 'Tenant Hub', description: 'Digital tenant profiles, lease tracking, and automated renewals. Keep all tenant communication and documents in one place.' },
  { key: 'finance', title: 'Financial Intelligence', description: 'Real-time income tracking, expense management, and profitability analytics. Export reports for tax season in seconds.' },
  { key: 'maintenance', title: 'Smart Maintenance', description: 'AI-powered request categorization, vendor management, and automated workflows. Reduce response time by 60%.' },
  { key: 'insights', title: 'Data Insights', description: 'Predictive analytics for rent optimization, occupancy forecasting, and portfolio performance benchmarking.' },
  { key: 'ai', title: 'AI Assistant', description: 'Natural language queries, automated document parsing, and intelligent suggestions that learn from your workflow.' },
]

const testimonials = [
  { quote: 'PROPERTECH Software reduced my admin time from 15 hours to 3 hours per week. Game changer.', author: 'Kibera Landlord', role: 'Property Owner, 12 units', avatar: 'KL' },
  { quote: 'The AI maintenance categorization alone is worth the subscription. It just works.', author: 'Nairobi PM', role: 'Property Manager, 45 units', avatar: 'NP' },
  { quote: "Finally, software that doesn't feel like it was built in 2005. Clean, fast, intuitive.", author: 'Mombasa Investor', role: 'Real Estate Investor', avatar: 'MI' },
]

const pricingPlans = [
  {
    name: 'Freemium',
    usd: 0,
    label: '7-day full access',
    description: 'Try all features FREE',
    popular: false,
    features: [
      '1 property',
      'Up to 5 units',
      'All core features',
      'Email support',
      '7-day trial period',
    ],
    cta: 'Start Free Trial',
    badge: '🎁 FREE',
  },
  {
    name: 'Starter',
    usd: 49,
    label: 'Up to 10 units',
    description: 'Perfect for independent landlords',
    popular: false,
    features: [
      'Up to 3 properties',
      'Up to 10 units total',
      'Tenant portal',
      'Payment tracking',
      'Basic maintenance',
      'Email support',
    ],
    cta: 'Get Started',
  },
  {
    name: 'Professional',
    usd: 99,
    label: 'Up to 50 units',
    description: 'For growing property portfolios',
    popular: true,
    features: [
      'Up to 10 properties',
      'Up to 50 units total',
      'All Starter features',
      'Advanced analytics',
      'Priority support',
      'M-Pesa integration',
    ],
    cta: 'Get Started',
    badge: '🔥 POPULAR',
  },
  {
    name: 'Enterprise',
    usd: 0,
    label: 'Unlimited units',
    description: 'Custom for management firms',
    popular: false,
    custom: true,
    features: [
      'Unlimited properties',
      'Unlimited units',
      'All Pro features',
      'Custom integrations',
      'Dedicated support',
      'White-label option',
    ],
    cta: 'Contact Sales',
    badge: '🏢 CUSTOM',
  },
]

export default function Page() {
  const router = useRouter()
  const { isAuthenticated, role, user } = useAuth()
  const [email, setEmail] = useState('')
  const [waiting, setWaiting] = useState(false)
  const [waitSuccess, setWaitSuccess] = useState<string | null>(null)
  const [waitError, setWaitError] = useState<string | null>(null)
  const [currency, setCurrency] = useState<'KES' | 'USD'>('KES')

  const USD_TO_KES = 132

  useEffect(() => {
    if (isAuthenticated && role && user) {
      const roleRedirects: Record<string, string> = {
        owner: '/owner',
        tenant: '/tenant',
        staff: '/staff',
        caretaker: '/caretaker',
        agent: '/agent',
        admin: '/admin',
      }
      const targetPath = roleRedirects[role.toLowerCase()];
      if (targetPath) {
        router.push(targetPath);
      }
      // If role is unknown, stay on homepage (don't redirect to avoid loop)
    }
  }, [isAuthenticated, role, user, router])

  async function handleWaitlist() {
    if (!email) return setWaitError('Please enter your email')
    setWaiting(true)
    setWaitError(null)
    setWaitSuccess(null)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setWaitSuccess("Thanks — check your inbox. You're on the waitlist.")
        setEmail('')
      } else {
        const json = await res.json()
        setWaitError(json?.error || 'Unable to join waitlist')
      }
    } catch (err: any) {
      setWaitError(err?.message || 'Network error')
    } finally {
      setWaiting(false)
      setTimeout(() => {
        setWaitSuccess(null)
        setWaitError(null)
      }, 5000)
    }
  }

  const formatPrice = (usd: number) => {
    if (usd === 0) return 'FREE'
    return currency === 'USD'
      ? `$${usd}`
      : `KES ${Math.round(usd * USD_TO_KES).toLocaleString()}`
  }

  const handlePricingCTA = (plan: string) => {
    if (plan === 'Enterprise') {
      router.push('/contact')
    } else {
      router.push(`/register?plan=${plan.toLowerCase()}&role=owner`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 header-backdrop bg-slate-900/50 border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => router.push('/')}
          >
            <Image
              src="/logo.svg"
              alt="Propertech Software"
              width={150}
              height={40}
              priority
              className="h-12 w-auto"
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/login')}
              className="text-blue-300 hover:text-blue-200 transition"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/register')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="pt-24 relative z-10">
        {/* HERO WITH ROLE-SPECIFIC CTAS */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Property Management <span className="text-gradient">Reimagined</span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg text-blue-100 mb-8">
              For modern landlords and field agents who want fewer spreadsheets and more control.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <button
                onClick={() => router.push('/register?plan=freemium&role=owner')}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition transform hover:scale-105 inline-flex items-center gap-2"
              >
                I'm a Property Owner <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => router.push('/register?plan=freemium&role=agent')}
                className="px-8 py-3 bg-slate-800 text-blue-100 rounded-lg font-semibold border border-blue-500/40 hover:bg-slate-700 transition inline-flex items-center gap-2"
              >
                I'm a Letting / Sales Agent
              </button>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuresData.map(({ key, title, description }) => (
                <div key={key} className="text-center group">
                  <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-500/40 transition">
                    <span className="text-2xl font-bold text-blue-300">{key[0].toUpperCase()}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{title}</h3>
                  <p className="text-blue-200">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Simple, Transparent <span className="text-gradient">Pricing</span>
              </h2>
              <div className="flex justify-center gap-2 mb-8">
                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    currency === 'USD'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-blue-200 hover:bg-slate-700'
                  }`}
                >
                  USD
                </button>
                <button
                  onClick={() => setCurrency('KES')}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    currency === 'KES'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-blue-200 hover:bg-slate-700'
                  }`}
                >
                  KES
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pricingPlans.map((p) => (
                <div
                  key={p.name}
                  className={`relative rounded-3xl p-8 bg-slate-800/50 border-2 transition-all group hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 ${
                    p.popular ? 'border-blue-500/50 bg-gradient-to-b from-blue-500/5 ring-2 ring-blue-500/30 scale-105' : 'border-slate-700/50'
                  }`}
                >
                  {p.badge && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-slate-900 px-4 py-1 rounded-xl text-sm font-bold border border-slate-700">
                      {p.badge}
                    </div>
                  )}
                  
                  <h3 className="text-2xl font-bold text-white mb-4">{p.name}</h3>
                  
                  <div className="mb-6">
                    <div className="text-4xl lg:text-5xl font-bold text-white mb-2">
                      {formatPrice(p.usd)}
                    </div>
                    <div className="text-blue-200 text-sm">{p.label}</div>
                  </div>
                  
                  <p className="text-blue-100 mb-8">{p.description}</p>
                  
                  <ul className="space-y-3 mb-8">
                    {p.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-blue-200">
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    onClick={() => handlePricingCTA(p.name)}
                    className={`w-full py-4 px-6 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                      p.popular
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-blue-500/50 hover:from-blue-600 hover:to-purple-700'
                        : p.custom
                        ? 'bg-gradient-to-r from-slate-700 to-slate-600 text-white border border-slate-500 hover:from-slate-600 hover:to-slate-500'
                        : 'bg-blue-600/80 text-white border border-blue-500/50 hover:bg-blue-700 hover:border-blue-400'
                    }`}
                  >
                    {p.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16">What Landlords Are Saying</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map(({ quote, author, role, avatar }, i) => (
                <div key={i} className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 hover:border-blue-500/50 transition">
                  <p className="text-blue-100 mb-6 italic">"{quote}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-xl font-bold text-white">
                      {avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{author}</div>
                      <div className="text-blue-300 text-sm">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WAITLIST */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Ready to Transform Your Portfolio?</h2>
            <p className="text-blue-200 mb-8 text-lg">Join 500+ landlords already saving 12+ hours per week</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-6 py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-blue-300 focus:border-blue-500 focus:outline-none transition"
                disabled={waiting}
              />
              <button
                onClick={handleWaitlist}
                disabled={waiting}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {waiting ? 'Joining...' : 'Join Waitlist'}
              </button>
            </div>
            {waitSuccess && (
              <p className="mt-4 text-green-400 text-sm font-medium">{waitSuccess}</p>
            )}
            {waitError && (
              <p className="mt-4 text-red-400 text-sm font-medium">{waitError}</p>
            )}
          </div>
        </section>
        
        {/* FOOTER */}
        <footer className="border-t border-slate-800/60 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-blue-200">
            <p className="text-xs text-blue-400">
              © {new Date().getFullYear()} PROPERTECH SOFTWARE. All rights reserved.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/privacy')}
                className="hover:text-white transition"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => router.push('/terms')}
                className="hover:text-white transition"
              >
                Terms
              </button>
              <button
                onClick={() => router.push('/cookies')}
                className="hover:text-white transition"
              >
                Cookie Policy
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
