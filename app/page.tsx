'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Sparkles, BarChart3, CheckCircle2, Shield, Zap, ArrowRight } from 'lucide-react'

const featuresData = [
  { key: 'portfolio', title: "Property Portfolio", description: "Centralized dashboard for all your properties. Track occupancy, manage units, and visualize your entire portfolio at a glance." },
  { key: 'tenant', title: "Tenant Hub", description: "Digital tenant profiles, lease tracking, and automated renewals. Keep all tenant communication and documents in one place." },
  { key: 'finance', title: "Financial Intelligence", description: "Real-time income tracking, expense management, and profitability analytics. Export reports for tax season in seconds." },
  { key: 'maintenance', title: "Smart Maintenance", description: "AI-powered request categorization, vendor management, and automated workflows. Reduce response time by 60%." },
  { key: 'insights', title: "Data Insights", description: "Predictive analytics for rent optimization, occupancy forecasting, and portfolio performance benchmarking." },
  { key: 'ai', title: "AI Assistant", description: "Natural language queries, automated document parsing, and intelligent suggestions that learn from your workflow." },
]

const testimonials = [
  { quote: "PROPERTECH Software reduced my admin time from 15 hours to 3 hours per week. Game changer.", author: "Kibera Landlord", role: "Property Owner, 12 units", avatar: "KL" },
  { quote: "The AI maintenance categorization alone is worth the subscription. It just works.", author: "Nairobi PM", role: "Property Manager, 45 units", avatar: "NP" },
  { quote: "Finally, software that doesn't feel like it was built in 2005. Clean, fast, intuitive.", author: "Mombasa Investor", role: "Real Estate Investor", avatar: "MI" },
]

const pricingPlans = [
  { name: "Starter", usd: 49, label: "Up to 10 units", description: "Perfect for independent landlords", popular: false },
  { name: "Professional", usd: 99, label: "Up to 50 units", description: "For growing property portfolios", popular: true },
  { name: "Enterprise", usd: 0, label: "Unlimited units", description: "Custom for management firms", popular: false, custom: true },
]

export default function Page() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [waiting, setWaiting] = useState(false)
  const [waitSuccess, setWaitSuccess] = useState<string | null>(null)
  const [waitError, setWaitError] = useState<string | null>(null)
  const [currency, setCurrency] = useState<'KES' | 'USD'>('KES')

  const USD_TO_KES = 132

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
    if (usd === 0) return 'Custom'
    return currency === 'USD' ? `$${usd}` : `KES ${Math.round(usd * USD_TO_KES).toLocaleString()}`
  }

  return (
    <>
      {/* Fixed Background Layers */}
      <div className="fixed inset-0 -z-50 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-950 opacity-90"></div>
        
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 gradient-overlay-animated"></div>

        {/* Skyline Layer */}
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-30 skyline-parallax"></div>

        {/* Particle Field */}
        <div className="absolute inset-0 particle-field"></div>

        {/* Animated Orbs */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-500 rounded-full opacity-10 blur-3xl orb-blue"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500 rounded-full opacity-5 blur-3xl orb-purple"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 header-backdrop bg-slate-900/50 border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="PROPERTECH Software" className="w-10 h-10" />
            <div className="text-2xl font-bold text-gradient">
              PROPERTECH
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => router.push('/auth/login')} className="px-4 py-2 text-blue-300 hover:text-blue-200 transition">Login</button>
            <button onClick={() => router.push('/auth/signup')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">Sign Up</button>
          </div>
        </div>
      </header>

      <main className="pt-24 relative z-10">
        {/* HERO */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-blue-400/50 card-backdrop animate-slide-in">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Property Management — Beta</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in-up delay-200">
              Property Management <span className="block text-gradient">Reimagined</span>
            </h1>

            <p className="text-lg text-blue-100 max-w-3xl mx-auto mb-8 animate-fade-in-up delay-400">
              Stop chasing rent with spreadsheets and WhatsApp. PROPERTECH Software centralizes tenants, payments, maintenance and finances in one beautiful dashboard — built for landlords in Kenya & Africa.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up delay-600">
              <button onClick={() => router.push('/auth/signup')} className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition transform hover:scale-105 flex items-center justify-center gap-2">
                Start Free 14-Day Trial <ArrowRight className="w-4 h-4" />
              </button>
              <button className="px-8 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition card-backdrop border border-white/20">
                Watch 2-Min Demo
              </button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-blue-200">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-400" />No credit card</div>
              <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-blue-400" />Bank-level security</div>
              <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400" />Setup in 5 mins</div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 max-w-6xl mx-auto animate-fade-in-up delay-800">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-blue-500/30 card-backdrop">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
              <div className="relative bg-slate-800/50 p-6 md:p-10 rounded-2xl">
                <div className="h-[380px] flex items-center justify-center text-center">
                  <div>
                    <BarChart3 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-float" />
                    <div className="text-lg font-semibold text-blue-100 mb-1">Dashboard preview coming soon</div>
                    <div className="text-blue-300/80">Real-time metrics • Occupancy • Revenue • Tickets</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="py-12 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-y border-blue-500/20 card-backdrop">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="animate-fade-in-up delay-0"><div className="text-4xl font-bold text-blue-400">10+</div><div className="text-blue-200 mt-1">Hours saved weekly</div></div>
              <div className="animate-fade-in-up delay-100"><div className="text-4xl font-bold text-blue-400">50%</div><div className="text-blue-200 mt-1">Faster maintenance</div></div>
              <div className="animate-fade-in-up delay-200"><div className="text-4xl font-bold text-blue-400">98%</div><div className="text-blue-200 mt-1">Payment on-time rate</div></div>
              <div className="animate-fade-in-up delay-300"><div className="text-4xl font-bold text-blue-400">24/7</div><div className="text-blue-200 mt-1">Tenant self-service</div></div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center mb-12 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Everything You Need. <span className="text-gradient">Nothing You Don't.</span></h2>
            <p className="text-blue-200 max-w-2xl mx-auto">Purpose-built features that actually solve real problems — no bloat, no complexity.</p>
          </div>

          <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresData.map((f, i) => (
              <div key={f.key} className="bg-slate-800/50 border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/70 hover:shadow-lg hover:shadow-blue-500/20 transition card-backdrop animate-fade-in-up group cursor-pointer" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 text-white font-semibold group-hover:animate-pulse-glow">{f.title.charAt(0)}</div>
                <h3 className="font-semibold text-white mb-2 group-hover:text-blue-300 transition">{f.title}</h3>
                <p className="text-blue-200/80">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-blue-600/5 to-transparent">
          <div className="max-w-7xl mx-auto text-center mb-12 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Loved by Property Managers</h2>
            <p className="text-blue-200 max-w-2xl mx-auto">Join landlords and property managers who've transformed their workflow.</p>
          </div>

          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-slate-800/50 border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/70 card-backdrop hover:shadow-lg hover:shadow-blue-500/20 transition animate-fade-in-up" style={{ animationDelay: `${i * 0.2}s` }}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">{t.avatar}</div>
                  <div>
                    <div className="font-semibold text-white">{t.author}</div>
                    <div className="text-sm text-blue-300/70">{t.role}</div>
                  </div>
                </div>
                <p className="text-blue-100 italic">"{t.quote}"</p>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center mb-8 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-blue-200 max-w-2xl mx-auto">14-day free trial • No credit card required • Cancel anytime</p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button onClick={() => setCurrency('KES')} className={`px-4 py-2 rounded-lg font-semibold transition ${currency === 'KES' ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-blue-200 hover:bg-slate-700'}`}>KES</button>
              <button onClick={() => setCurrency('USD')} className={`px-4 py-2 rounded-lg font-semibold transition ${currency === 'USD' ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-blue-200 hover:bg-slate-700'}`}>USD</button>
            </div>
          </div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            {pricingPlans.map((p, i) => (
              <div key={i} className={`rounded-2xl p-6 card-backdrop transition animate-fade-in-up ${p.popular ? 'border-2 border-blue-500 shadow-2xl shadow-blue-500/30 bg-slate-800/80' : 'border border-blue-500/30 shadow-lg bg-slate-800/50'}`} style={{ animationDelay: `${i * 0.2}s` }}>
                {p.popular && <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full mb-4 text-sm font-semibold">Most Popular</div>}
                <h3 className="text-2xl font-semibold text-white">{p.name}</h3>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-gradient">{p.custom ? 'Custom' : formatPrice(p.usd)}</span>
                  {!p.custom && <span className="text-blue-300 ml-2 text-sm">/month</span>}
                </div>
                <p className="text-blue-200 mt-2">{p.description}</p>

                <ul className="mt-4 space-y-2 text-blue-200">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" />{p.label}</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" />Tenant portal</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" />Maintenance requests</li>
                </ul>

                <div className="mt-6">
                  <button onClick={() => router.push('/auth/signup')} className={`w-full py-3 rounded-lg font-semibold transition ${p.popular ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-blue-500/50' : 'bg-slate-700/50 text-blue-200 hover:bg-slate-700'}`}>
                    {p.custom ? 'Contact Sales' : 'Start Free Trial'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WAITLIST CTA */}
        <section id="waitlist" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 border-t border-b border-blue-500/30 card-backdrop">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-blue-400/50 card-backdrop">
              <Mail className="w-4 h-4" />
              <span>Join landlords on the waitlist</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ready to Transform Your Property Management?</h2>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto mb-8">Start your 14-day free trial today. No credit card required. Get lifetime early-bird pricing at 50% off (first 100 signups).</p>

            <div className="max-w-md mx-auto">
              <div className="flex gap-3">
                <input type="email" className="flex-1 px-4 py-3 rounded-lg bg-slate-800/70 border border-blue-500/30 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 card-backdrop" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <button onClick={handleWaitlist} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition disabled:opacity-50" disabled={waiting}>{waiting ? 'Joining…' : 'Get Started'}</button>
              </div>

              {waitSuccess && <div className="mt-4 text-green-400 text-sm">{waitSuccess}</div>}
              {waitError && <div className="mt-4 text-red-400 text-sm">{waitError}</div>}

              <p className="text-blue-200 text-sm mt-6">🎉 <strong>Limited Offer:</strong> First 100 signups get 50% off forever</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/80 border-t border-blue-500/20 card-backdrop py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.svg" alt="PROPERTECH Software" className="w-8 h-8" />
                <span className="text-xl font-bold text-gradient">PROPERTECH</span>
              </div>
              <p className="text-blue-200/70 text-sm">Smarter property management for landlords across Africa.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-blue-200/70 text-sm">
                <li><button onClick={() => document.getElementById('features')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-blue-300 transition">Features</button></li>
                <li><button onClick={() => document.getElementById('pricing')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-blue-300 transition">Pricing</button></li>
                <li><button className="hover:text-blue-300 transition">Security</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-blue-200/70 text-sm">
                <li><button className="hover:text-blue-300 transition">About</button></li>
                <li><button className="hover:text-blue-300 transition">Blog</button></li>
                <li><button className="hover:text-blue-300 transition">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-blue-200/70 text-sm">
                <li><button className="hover:text-blue-300 transition">Privacy</button></li>
                <li><button className="hover:text-blue-300 transition">Terms</button></li>
                <li><button className="hover:text-blue-300 transition">Cookie Policy</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-500/20 pt-8 text-center text-blue-200/50 text-sm">
            <p>&copy; 2025 PROPERTECH Software. All rights reserved. Built for Africa, by Africans.</p>
          </div>
        </div>
      </footer>
    </>
  )
}