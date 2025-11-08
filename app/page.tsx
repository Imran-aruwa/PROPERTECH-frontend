// app/page.tsx
'use client'
import React, { useState } from 'react';
import Head from 'next/head';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import AuthModal from '@/components/ui/AuthModal';
import Button from '@/components/ui/Button';
import { Mail, Sparkles, BarChart3, CheckCircle2, Shield, Zap, ArrowRight } from 'lucide-react';
import { submitWaitlist } from '@/lib/waitlist';

const featuresData = [
  { key: 'portfolio', title: "Property Portfolio", description: "Centralized dashboard for all your properties. Track occupancy, manage units, and visualize your entire portfolio at a glance." },
  { key: 'tenant', title: "Tenant Hub", description: "Digital tenant profiles, lease tracking, and automated renewals. Keep all tenant communication and documents in one place." },
  { key: 'finance', title: "Financial Intelligence", description: "Real-time income tracking, expense management, and profitability analytics. Export reports for tax season in seconds." },
  { key: 'maintenance', title: "Smart Maintenance", description: "AI-powered request categorization, vendor management, and automated workflows. Reduce response time by 60%." },
  { key: 'insights', title: "Data Insights", description: "Predictive analytics for rent optimization, occupancy forecasting, and portfolio performance benchmarking." },
  { key: 'ai', title: "AI Assistant", description: "Natural language queries, automated document parsing, and intelligent suggestions that learn from your workflow." },
];

const testimonials = [
  { quote: "PROPERTECH reduced my admin time from 15 hours to 3 hours per week. Game changer.", author: "Kibera Landlord", role: "Property Owner, 12 units", avatar: "KL" },
  { quote: "The AI maintenance categorization alone is worth the subscription. It just works.", author: "Nairobi PM", role: "Property Manager, 45 units", avatar: "NP" },
  { quote: "Finally, software that doesn't feel like it was built in 2005. Clean, fast, intuitive.", author: "Mombasa Investor", role: "Real Estate Investor", avatar: "MI" },
];

const pricingPlans = [
  { name: "Starter", usd: 49, label: "Up to 10 units", description: "Perfect for independent landlords", popular: false },
  { name: "Professional", usd: 99, label: "Up to 50 units", description: "For growing property portfolios", popular: true },
  { name: "Enterprise", usd: 0, label: "Unlimited units", description: "Custom for management firms", popular: false, custom: true },
];

export default function Page() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  // waitlist
  const [email, setEmail] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [waitSuccess, setWaitSuccess] = useState<string | null>(null);
  const [waitError, setWaitError] = useState<string | null>(null);

  // currency toggle
  const [currency, setCurrency] = useState<'KES' | 'USD'>('KES');
  const USD_TO_KES = 132; // adjust when needed

  async function handleWaitlist(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!email) return setWaitError('Please enter your email');
    setWaiting(true); setWaitError(null); setWaitSuccess(null);
    try {
      const res = await submitWaitlist({ email });
      if (res.ok) {
        setWaitSuccess('Thanks — check your inbox. You’re on the waitlist.');
        setEmail('');
      } else {
        const json = await res.json();
        setWaitError(json?.error || 'Unable to join waitlist');
      }
    } catch (err: any) {
      setWaitError(err?.message || 'Network error');
    } finally {
      setWaiting(false);
      setTimeout(() => { setWaitSuccess(null); setWaitError(null); }, 5000);
    }
  }

  const formatPrice = (usd: number) => {
    if (usd === 0) return 'Custom';
    return currency === 'USD' ? `$${usd}` : `KES ${Math.round(usd * USD_TO_KES).toLocaleString()}`;
  };

  return (
    <>
      <Head>
        <title>Propertech — Smarter Property Management</title>
        <meta name="description" content="Propertech — all-in-one property management for landlords and property managers in Kenya & Africa." />
      </Head>

      <Header onShowLogin={() => setShowLogin(true)} onShowSignup={() => setShowSignup(true)} />

      <main className="pt-24">
        {/* HERO */}
        <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-blue-100">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Property Management — Beta</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Property Management <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Reimagined</span>
            </h1>

            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
              Stop chasing rent with spreadsheets and WhatsApp. Propertech centralizes tenants, payments, maintenance and finances in one beautiful dashboard — built for landlords in Kenya & Africa.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button onClick={() => setShowSignup(true)} variant="primary" className="px-6 py-3 text-lg">
                Start Free 14-Day Trial <ArrowRight className="ml-2" />
              </Button>
              <Button onClick={() => window.open('/auth/demo', '_blank')} variant="outline" className="px-6 py-3 text-lg">
                Watch 2-Min Demo
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" />No credit card</div>
              <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-blue-600" />Bank-level security</div>
              <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-600" />Setup in 5 mins</div>
            </div>
          </div>

          {/* dashboard preview */}
          <div className="mt-12 max-w-6xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10 pointer-events-none"></div>
              <div className="relative bg-white p-6 md:p-10 rounded-2xl">
                <div className="h-[380px] flex items-center justify-center text-center">
                  <div>
                    <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <div className="text-lg font-semibold text-gray-900 mb-1">Dashboard preview coming soon</div>
                    <div className="text-gray-600">Real-time metrics • Occupancy • Revenue • Tickets</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="py-12 bg-gray-50 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div><div className="text-3xl md:text-4xl font-bold text-blue-600">10+</div><div className="text-gray-600 mt-1">Hours saved weekly</div></div>
              <div><div className="text-3xl md:text-4xl font-bold text-blue-600">50%</div><div className="text-gray-600 mt-1">Faster maintenance</div></div>
              <div><div className="text-3xl md:text-4xl font-bold text-blue-600">98%</div><div className="text-gray-600 mt-1">Payment on-time rate</div></div>
              <div><div className="text-3xl md:text-4xl font-bold text-blue-600">24/7</div><div className="text-gray-600 mt-1">Tenant self-service</div></div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything You Need. <span className="text-gradient">Nothing You Don't.</span></h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Purpose-built features that actually solve real problems — no bloat, no complexity.</p>
          </div>

          <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresData.map((f) => (
              <div key={f.key} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 text-blue-600 font-semibold">{f.title.charAt(0)}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials" className="py-20 bg-gradient-to-br from-gray-50 to-white px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Loved by Property Managers</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Join landlords and property managers who've transformed their workflow.</p>
          </div>

          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">{t.avatar}</div>
                  <div>
                    <div className="font-semibold text-gray-900">{t.author}</div>
                    <div className="text-sm text-gray-500">{t.role}</div>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{t.quote}"</p>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-20 bg-white px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">14-day free trial • No credit card required • Cancel anytime</p>

            <div className="mt-4 flex items-center justify-center gap-3">
              <button className={`px-3 py-1 rounded-md ${currency === 'KES' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`} onClick={() => setCurrency('KES')}>KES</button>
              <button className={`px-3 py-1 rounded-md ${currency === 'USD' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`} onClick={() => setCurrency('USD')}>USD</button>
            </div>
          </div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            {pricingPlans.map((p, i) => (
              <div key={i} className={`rounded-2xl p-6 ${p.popular ? 'border-2 border-blue-600 shadow-2xl' : 'border border-gray-200 shadow-lg'}`}>
                {p.popular && <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full mb-4">Most Popular</div>}
                <h3 className="text-xl font-semibold text-gray-900">{p.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{p.custom ? 'Custom' : formatPrice(p.usd)}</span>
                  {!p.custom && <span className="text-gray-500 ml-2 text-sm">/month</span>}
                </div>
                <p className="text-gray-600 mt-2">{p.description}</p>

                <ul className="mt-4 space-y-2 text-gray-700">
                  <li>{p.label}</li>
                  <li>Tenant portal</li>
                  <li>Maintenance requests</li>
                </ul>

                <div className="mt-6">
                  <Button onClick={() => setShowSignup(true)} variant={p.popular ? 'primary' : 'ghost'} className="w-full py-3">
                    {p.custom ? 'Contact Sales' : 'Start Free Trial'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WAITLIST CTA */}
        <section id="waitlist" className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Mail className="w-4 h-4" />
              <span>Join landlords on the waitlist</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to Transform Your Property Management?</h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-6">Start your 14-day free trial today. No credit card required. Get lifetime early-bird pricing at 50% off (first 100 signups).</p>

            <form onSubmit={(e) => { e.preventDefault(); handleWaitlist(e); }} className="max-w-md mx-auto">
              <div className="flex gap-3">
                <input type="email" className="flex-1 px-4 py-3 rounded-xl text-gray-900" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <button type="submit" className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold" disabled={waiting}>{waiting ? 'Joining…' : 'Get Started'}</button>
              </div>

              {waitSuccess && <div className="mt-4 text-green-100">{waitSuccess}</div>}
              {waitError && <div className="mt-4 text-red-100">{waitError}</div>}

              <p className="text-blue-100 text-sm mt-6">🎉 <strong>Limited Offer:</strong> First 100 signups get 50% off forever</p>
            </form>
          </div>
        </section>
      </main>

      <Footer />

      {/* auth modals */}
      <AuthModal show={showLogin} mode="login" onClose={() => setShowLogin(false)} />
      <AuthModal show={showSignup} mode="signup" onClose={() => setShowSignup(false)} />
    </>
  );
}
