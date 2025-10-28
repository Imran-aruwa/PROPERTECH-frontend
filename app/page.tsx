'use client'
import React, { useState } from 'react';
import { Building2, Users, DollarSign, Wrench, BarChart3, CheckCircle2, ArrowRight, Mail, Sparkles, Shield, Zap } from 'lucide-react';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const waitlist = JSON.parse(localStorage.getItem('waitlist') || '[]');
    waitlist.push({ email, date: new Date().toISOString() });
    localStorage.setItem('waitlist', JSON.stringify(waitlist));
    
    setSubmitted(true);
    setEmail('');
    
    setTimeout(() => setSubmitted(false), 3000);
  };

  const features = [
    {
      icon: Building2,
      title: "Property Portfolio",
      description: "Centralized dashboard for all your properties. Track occupancy, manage units, and visualize your entire portfolio at a glance."
    },
    {
      icon: Users,
      title: "Tenant Hub",
      description: "Digital tenant profiles, lease tracking, and automated renewals. Keep all tenant communication and documents in one place."
    },
    {
      icon: DollarSign,
      title: "Financial Intelligence",
      description: "Real-time income tracking, expense management, and profitability analytics. Export reports for tax season in seconds."
    },
    {
      icon: Wrench,
      title: "Smart Maintenance",
      description: "AI-powered request categorization, vendor management, and automated workflows. Reduce response time by 60%."
    },
    {
      icon: BarChart3,
      title: "Data Insights",
      description: "Predictive analytics for rent optimization, occupancy forecasting, and portfolio performance benchmarking."
    },
    {
      icon: Sparkles,
      title: "AI Assistant",
      description: "Natural language queries, automated document parsing, and intelligent suggestions that learn from your workflow."
    }
  ];

  const benefits = [
    { stat: "10+", label: "Hours saved weekly" },
    { stat: "50%", label: "Faster maintenance" },
    { stat: "98%", label: "Payment on-time rate" },
    { stat: "24/7", label: "Tenant self-service" }
  ];

  const pricing = [
    {
      name: "Starter",
      price: "$49",
      period: "/month",
      description: "Perfect for independent landlords",
      features: [
        "Up to 10 units",
        "Unlimited tenants",
        "Financial dashboard",
        "Mobile app access",
        "Email support"
      ],
      cta: "Start Free Trial"
    },
    {
      name: "Professional",
      price: "$99",
      period: "/month",
      description: "For growing property portfolios",
      features: [
        "Up to 50 units",
        "Advanced analytics",
        "AI maintenance routing",
        "Tenant portal",
        "Priority support",
        "API access"
      ],
      popular: true,
      cta: "Start Free Trial"
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For property management firms",
      features: [
        "Unlimited units",
        "Multi-user accounts",
        "White-label solution",
        "Custom integrations",
        "Dedicated account manager",
        "SLA guarantee"
      ],
      cta: "Contact Sales"
    }
  ];

  const testimonials = [
    {
      quote: "PROPERTECH reduced my admin time from 15 hours to 3 hours per week. Game changer.",
      author: "Sarah Martinez",
      role: "Property Owner, 12 units",
      avatar: "SM"
    },
    {
      quote: "The AI maintenance categorization alone is worth the subscription. It just works.",
      author: "David Chen",
      role: "Property Manager, 45 units",
      avatar: "DC"
    },
    {
      quote: "Finally, software that doesn't feel like it was built in 2005. Clean, fast, intuitive.",
      author: "Emily Thompson",
      role: "Real Estate Investor",
      avatar: "ET"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Your PROPERTECH Logo */}
            <div className="flex items-center gap-3">
              <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" rx="20" fill="#1A89FF"/>
                <rect x="30" y="30" width="12" height="12" rx="3" fill="white"/>
                <rect x="48" y="30" width="12" height="12" rx="3" fill="white"/>
                <rect x="30" y="48" width="12" height="12" rx="3" fill="white"/>
              </svg>
              <div>
                <div className="text-2xl font-bold text-gray-900">PROPERTECH</div>
                <div className="text-xs text-gray-500 -mt-1">Smarter Property Management, Anywhere</div>
              </div>
            </div>
            <div className="hidden md:flex gap-8 items-center">
              <a href="#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition">Testimonials</a>
              <a href="#waitlist" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition text-sm font-semibold shadow-sm">
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Modern & Unique */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-blue-100">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Property Management • Now in Beta</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
              Property Management
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600">
                Reimagined
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto">
              The all-in-one platform that combines powerful automation, 
              intelligent insights, and beautiful design. Built for modern landlords who refuse to settle.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#waitlist" className="group bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105">
                Start Free 14-Day Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <button className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all">
                Watch 2-Min Demo
              </button>
            </div>
            
            <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Bank-level security
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                Setup in 5 minutes
              </div>
            </div>
          </div>

          {/* Dashboard Preview - Modern Card */}
          <div className="mt-20 max-w-6xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl transform rotate-1"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl p-2">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 h-[500px] flex items-center justify-center border border-gray-200">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6">
                      <BarChart3 className="w-10 h-10 text-blue-600" />
                    </div>
                    <p className="text-gray-900 text-xl font-semibold mb-2">Beautiful Dashboard Coming Soon</p>
                    <p className="text-gray-500">Clean interface • Real-time data • Mobile-first design</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">{benefit.stat}</div>
                <div className="text-gray-600 text-sm md:text-base">{benefit.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Modern Grid */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Everything You Need.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Nothing You Don't.</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Purpose-built features that actually solve real problems. No bloat, no complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="group relative bg-white border border-gray-200 rounded-2xl p-8 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gradient-to-br from-gray-50 to-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Loved by Property Managers
            </h2>
            <p className="text-xl text-gray-600">Join hundreds of landlords who've transformed their workflow</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition border border-gray-100">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">14-day free trial • No credit card required • Cancel anytime</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricing.map((plan, idx) => (
              <div 
                key={idx} 
                className={`relative bg-white rounded-2xl p-8 border-2 transition-all hover:scale-105 ${
                  plan.popular 
                    ? 'border-blue-600 shadow-2xl' 
                    : 'border-gray-200 hover:border-blue-300 shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-4 rounded-xl font-semibold transition-all ${
                  plan.popular 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section id="waitlist" className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Mail className="w-4 h-4 inline mr-2" />
            Join 500+ landlords on the waitlist
          </div>

          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Ready to Transform Your
            <span className="block">Property Management?</span>
          </h2>
          
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Start your 14-day free trial today. No credit card required. 
            Get lifetime early-bird pricing at 50% off.
          </p>

          <div className="max-w-md mx-auto">
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-xl focus:ring-4 focus:ring-white/50 focus:outline-none text-lg"
              />
              <button
                onClick={handleSubmit}
                className="bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-800 transition-all whitespace-nowrap shadow-xl hover:shadow-2xl"
              >
                Get Started
              </button>
            </div>
            
            {submitted && (
              <div className="mt-6 bg-white/20 backdrop-blur-sm text-white px-6 py-4 rounded-xl flex items-center justify-center gap-2 border border-white/30">
                <CheckCircle2 className="w-5 h-5" />
                <span>Success! We'll be in touch soon.</span>
              </div>
            )}

            <p className="text-blue-100 text-sm mt-6">
              🎉 <strong>Limited Offer:</strong> First 100 signups get 50% off forever
            </p>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-8 text-blue-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>No credit card needed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100" height="100" rx="20" fill="#1A89FF"/>
                  <rect x="30" y="30" width="12" height="12" rx="3" fill="white"/>
                  <rect x="48" y="30" width="12" height="12" rx="3" fill="white"/>
                  <rect x="30" y="48" width="12" height="12" rx="3" fill="white"/>
                </svg>
                <div>
                  <div className="text-xl font-bold">PROPERTECH</div>
                  <div className="text-xs text-gray-400">Smarter Property Management</div>
                </div>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Modern property management software built for the next generation 
                of landlords and property managers.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition">
                  <span className="sr-only">Twitter</span>𝕏
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition">
                  <span className="sr-only">LinkedIn</span>in
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition">
                  <span className="sr-only">Facebook</span>f
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Product</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition">Roadmap</a></li>
                <li><a href="#" className="hover:text-white transition">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Press Kit</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Legal</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
                <li><a href="#" className="hover:text-white transition">GDPR</a></li>
                <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                © 2025 PROPERTECH. All rights reserved. Built with ❤️ for landlords.
              </p>
              <div className="flex gap-6 text-sm text-gray-400">
                <a href="#" className="hover:text-white transition">Status</a>
                <a href="#" className="hover:text-white transition">API Docs</a>
                <a href="#" className="hover:text-white transition">Support</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}