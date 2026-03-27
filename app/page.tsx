'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/lib/auth-context'
import Image from 'next/image'
import {
  ArrowRight, Building2, Users, DollarSign, Wrench, BarChart3,
  Bot, Menu, X, Check, Star, Shield, Zap, Clock
} from 'lucide-react'

const featuresData = [
  { key: 'portfolio', title: 'Property Portfolio', description: 'Centralized dashboard for all your properties. Track occupancy, manage units, and visualize your entire portfolio at a glance.', icon: Building2 },
  { key: 'tenant', title: 'Tenant Hub', description: 'Digital tenant profiles, lease tracking, and automated renewals. Keep all tenant communication and documents in one place.', icon: Users },
  { key: 'finance', title: 'Financial Intelligence', description: 'Real-time income tracking, expense management, and profitability analytics. Export reports for tax season in seconds.', icon: DollarSign },
  { key: 'maintenance', title: 'Smart Maintenance', description: 'AI-powered request categorization, vendor management, and automated workflows. Reduce response time by 60%.', icon: Wrench },
  { key: 'insights', title: 'Data Insights', description: 'Predictive analytics for rent optimization, occupancy forecasting, and portfolio performance benchmarking.', icon: BarChart3 },
  { key: 'ai', title: 'AI Assistant', description: 'Natural language queries, automated document parsing, and intelligent suggestions that learn from your workflow.', icon: Bot },
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
  const [currency, setCurrency] = useState<'KES' | 'USD'>('KES')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    }
  }, [isAuthenticated, role, user, router])

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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 header-backdrop bg-slate-800/90 border-b border-slate-600/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => router.push('/')}
          >
            <div className="bg-white rounded-lg px-3 py-1.5">
              <Image
                src="/logo.svg"
                alt="ProperTech Software"
                width={160}
                height={40}
                priority
                className="h-8 w-auto object-contain"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#pricing" className="text-blue-200 hover:text-white transition text-sm font-medium">
              Pricing
            </a>
            <button
              onClick={() => router.push('/login')}
              className="text-blue-200 hover:text-white transition text-sm font-medium"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/register')}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-500 hover:to-blue-600 transition text-sm font-semibold shadow-lg shadow-blue-500/25"
            >
              Start Free Trial
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-blue-200 hover:text-white rounded-lg hover:bg-slate-800/50 transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800/98 border-t border-slate-700 px-4 py-4 space-y-3">
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-blue-200 hover:text-white transition font-medium"
            >
              Pricing
            </a>
            <button
              onClick={() => { router.push('/login'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2 text-blue-200 hover:text-white transition font-medium"
            >
              Login
            </button>
            <button
              onClick={() => { router.push('/register'); setMobileMenuOpen(false); }}
              className="block w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-center font-semibold"
            >
              Start Free Trial
            </button>
          </div>
        )}
      </header>

      {/* MAIN */}
      <main className="pt-24 relative z-10">
        {/* HERO WITH ROLE-SPECIFIC CTAS */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8">
              <div className="flex -space-x-2">
                {['bg-blue-500', 'bg-purple-500', 'bg-green-500'].map((color, i) => (
                  <div key={i} className={`w-6 h-6 ${color} rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-bold`}>
                    {['K', 'N', 'M'][i]}
                  </div>
                ))}
              </div>
              <span className="text-blue-200 text-sm">Trusted by 500+ landlords in Kenya</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Property Management<br />
              <span className="text-gradient">Reimagined</span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg text-blue-200/80 mb-10">
              The all-in-one platform for modern landlords and agents. Collect rent, track maintenance, and grow your portfolio — all from one dashboard.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={() => router.push('/register?plan=freemium&role=owner')}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/30 transition transform hover:scale-105 inline-flex items-center justify-center gap-2"
              >
                I'm a Property Owner <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => router.push('/register?plan=freemium&role=agent')}
                className="w-full sm:w-auto px-8 py-4 bg-slate-800/80 text-blue-100 rounded-xl font-semibold border border-slate-700 hover:bg-slate-700 hover:border-slate-600 transition inline-flex items-center justify-center gap-2"
              >
                I'm a Letting / Sales Agent
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {[
                { value: '12hrs', label: 'saved weekly' },
                { value: '500+', label: 'landlords' },
                { value: '99.9%', label: 'uptime' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-blue-300/60 text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Everything You Need to <span className="text-gradient">Succeed</span>
              </h2>
              <p className="text-blue-200 text-lg max-w-2xl mx-auto">
                Powerful tools designed specifically for Kenyan property managers and landlords
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuresData.map(({ key, title, description, icon: Icon }) => (
                <div key={key} className="bg-slate-700/40 border border-slate-600/50 rounded-2xl p-8 text-center group hover:border-blue-500/50 hover:bg-slate-700/60 transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all">
                    <Icon className="w-8 h-8 text-blue-400 group-hover:text-blue-300 transition" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
                  <p className="text-blue-200/80 text-sm leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/40">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Simple, Transparent <span className="text-gradient">Pricing</span>
              </h2>
              <p className="text-blue-200 mb-8">Start free, upgrade when you're ready</p>
              <div className="inline-flex gap-1 p-1 bg-slate-800/80 rounded-lg">
                <button
                  onClick={() => setCurrency('KES')}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition ${
                    currency === 'KES'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-blue-200 hover:text-white'
                  }`}
                >
                  KES
                </button>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition ${
                    currency === 'USD'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-blue-200 hover:text-white'
                  }`}
                >
                  USD
                </button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {pricingPlans.map((p) => (
                <div
                  key={p.name}
                  className={`relative rounded-2xl p-6 lg:p-8 bg-slate-700/50 border transition-all duration-300 hover:bg-slate-700/70 ${
                    p.popular
                      ? 'border-blue-500 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/10'
                      : 'border-slate-600/50 hover:border-slate-500'
                  }`}
                >
                  {p.badge && (
                    <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold ${
                      p.popular
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'bg-slate-700 text-blue-200 border border-slate-600'
                    }`}>
                      {p.badge}
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-white mb-1">{p.name}</h3>
                  <p className="text-blue-300/70 text-sm mb-4">{p.description}</p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl lg:text-4xl font-bold text-white">
                        {p.custom ? 'Custom' : formatPrice(p.usd)}
                      </span>
                      {!p.custom && p.usd > 0 && (
                        <span className="text-blue-300/70 text-sm">/mo</span>
                      )}
                    </div>
                    <div className="text-blue-300 text-sm mt-1">{p.label}</div>
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {p.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-blue-100">
                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePricingCTA(p.name)}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                      p.popular
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-blue-500/30 hover:from-blue-600 hover:to-purple-700'
                        : p.custom
                        ? 'bg-slate-700 text-white border border-slate-600 hover:bg-slate-600'
                        : 'bg-blue-600 text-white hover:bg-blue-500'
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
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Loved by <span className="text-gradient">Landlords</span>
              </h2>
              <p className="text-blue-200">See what property owners are saying about us</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map(({ quote, author, role, avatar }, i) => (
                <div key={i} className="bg-slate-700/40 rounded-2xl p-6 border border-slate-600/50 hover:border-blue-500/30 transition-all duration-300">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-blue-100/90 mb-6 text-sm leading-relaxed">"{quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                      {avatar}
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">{author}</div>
                      <div className="text-blue-300/70 text-xs">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-800 to-slate-900">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm font-medium">Start your free trial today</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Transform Your Portfolio?
            </h2>
            <p className="text-blue-200/80 mb-8">
              Join 500+ landlords already saving 12+ hours per week. No credit card required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={() => router.push('/register?plan=freemium&role=owner')}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/30 transition transform hover:scale-105 inline-flex items-center justify-center gap-2"
              >
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/contact')}
                className="px-8 py-4 bg-slate-800 text-blue-100 rounded-xl font-semibold border border-slate-700 hover:bg-slate-700 transition inline-flex items-center justify-center gap-2"
              >
                Talk to Sales
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-blue-300/60">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>7-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </section>
        
        {/* FOOTER */}
        <footer className="border-t border-slate-700 bg-slate-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div className="col-span-2 md:col-span-1">
                <div className="bg-white rounded-md px-2 py-1 inline-block mb-4">
                  <Image
                    src="/logo.svg"
                    alt="ProperTech Software"
                    width={120}
                    height={32}
                    className="h-7 w-auto object-contain"
                  />
                </div>
                <p className="text-blue-300/60 text-sm">
                  Modern property management for Kenyan landlords and agents.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4 text-sm">Product</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#pricing" className="text-blue-300/70 hover:text-white transition">Pricing</a></li>
                  <li><button onClick={() => router.push('/register')} className="text-blue-300/70 hover:text-white transition">Sign Up</button></li>
                  <li><button onClick={() => router.push('/login')} className="text-blue-300/70 hover:text-white transition">Login</button></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4 text-sm">Support</h4>
                <ul className="space-y-2 text-sm">
                  <li><button onClick={() => router.push('/contact')} className="text-blue-300/70 hover:text-white transition">Contact</button></li>
                  <li><a href="mailto:support@propertechsoftware.com" className="text-blue-300/70 hover:text-white transition">Email Us</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4 text-sm">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li><button onClick={() => router.push('/privacy')} className="text-blue-300/70 hover:text-white transition">Privacy</button></li>
                  <li><button onClick={() => router.push('/terms')} className="text-blue-300/70 hover:text-white transition">Terms</button></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-blue-400/60 text-xs">
                © {new Date().getFullYear()} PROPERTECH SOFTWARE. All rights reserved.
              </p>
              <div className="flex items-center gap-2 text-blue-400/60 text-xs">
                <Shield className="w-4 h-4" />
                <span>Secured with SSL encryption</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
