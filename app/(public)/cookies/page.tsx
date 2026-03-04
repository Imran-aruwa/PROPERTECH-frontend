'use client'

import { useState } from 'react'
import { ChevronDown, Cookie, Shield } from 'lucide-react'

function CookieSection({
  id,
  title,
  expandedId,
  toggle,
  content
}: {
  id: string
  title: string
  expandedId: string | null
  toggle: (id: string) => void
  content: React.ReactNode
}) {
  return (
    <div className="bg-bg-card rounded-xl shadow-sm border border-bd overflow-hidden">
      <button
        onClick={() => toggle(id)}
        className="w-full flex items-center justify-between p-6 hover:bg-bg-hover transition-colors"
      >
        <h2 className="text-xl font-semibold text-tx-primary">{title}</h2>
        <ChevronDown 
          className={`w-5 h-5 transition-transform ${expandedId === id ? 'rotate-180' : ''}`} 
        />
      </button>
      {expandedId === id && (
        <div className="px-6 pb-6 border-t border-bd">
          {content}
        </div>
      )}
    </div>
  )
}

export default function CookiesPage() {
  const [expandedId, setExpandedId] = useState<string | null>('intro')

  const toggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Cookie className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Cookie Policy</h1>
          </div>
          <p className="text-orange-100 text-lg">
            Learn how Propertech Software uses cookies to improve your experience
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 mt-8 pb-12 space-y-6">
        <CookieSection
          id="intro"
          title="1. What Are Cookies?"
          expandedId={expandedId}
          toggle={toggle}
          content={
            <div className="space-y-3 text-tx-secondary">
              <p>
                Cookies are small text files that are stored on your device when
                you visit our website or use our services. They help us remember
                your preferences, analyze usage patterns, and provide a better
                user experience.
              </p>
              <p>
                This Cookie Policy explains what cookies we use, why we use them,
                and how you can manage them. Our use of cookies is also governed
                by our{' '}
                <a href="/terms" className="text-blue-600 hover:underline font-medium">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-blue-600 hover:underline font-medium">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          }
        />

        <CookieSection
          id="types"
          title="2. Types of Cookies We Use"
          expandedId={expandedId}
          toggle={toggle}
          content={
            <div className="space-y-4 text-tx-secondary">
              <p>We use different types of cookies for various purposes:</p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-bg-secondary p-4 rounded-lg">
                  <h4 className="font-semibold text-tx-primary mb-2">Essential Cookies</h4>
                  <p className="text-sm text-tx-secondary">
                    Required for the website to function properly. These cookies ensure
                    basic functionalities like page navigation and access to secure areas.
                  </p>
                </div>
                <div className="bg-bg-secondary p-4 rounded-lg">
                  <h4 className="font-semibold text-tx-primary mb-2">Analytics Cookies</h4>
                  <p className="text-sm text-tx-secondary">
                    Help us understand how visitors use our site so we can improve it.
                  </p>
                </div>
                <div className="bg-bg-secondary p-4 rounded-lg">
                  <h4 className="font-semibold text-tx-primary mb-2">Functionality Cookies</h4>
                  <p className="text-sm text-tx-secondary">
                    Remember your preferences and settings to provide personalized experience.
                  </p>
                </div>
                <div className="bg-bg-secondary p-4 rounded-lg">
                  <h4 className="font-semibold text-tx-primary mb-2">Marketing Cookies</h4>
                  <p className="text-sm text-tx-secondary">
                    Used to deliver personalized ads and content based on your interests.
                  </p>
                </div>
              </div>
            </div>
          }
        />

        <CookieSection
          id="list"
          title="3. Cookies We Use"
          expandedId={expandedId}
          toggle={toggle}
          content={
            <div className="space-y-3 text-tx-secondary">
              <p>Below is a list of cookies currently used on our platform:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-bd">
                      <th className="text-left py-3 font-semibold text-tx-primary">Name</th>
                      <th className="text-left py-3 font-semibold text-tx-primary">Purpose</th>
                      <th className="text-left py-3 font-semibold text-tx-primary">Duration</th>
                      <th className="text-left py-3 font-semibold text-tx-primary">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-bd hover:bg-bg-hover">
                      <td className="py-3 font-mono">session_id</td>
                      <td className="py-3">Maintain user session</td>
                      <td className="py-3">Session</td>
                      <td className="py-3"><span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Essential</span></td>
                    </tr>
                    <tr className="border-b border-bd hover:bg-bg-hover">
                      <td className="py-3 font-mono">_ga</td>
                      <td className="py-3">Google Analytics</td>
                      <td className="py-3">2 years</td>
                      <td className="py-3"><span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Analytics</span></td>
                    </tr>
                    <tr className="border-b border-bd hover:bg-bg-hover">
                      <td className="py-3 font-mono">preferences</td>
                      <td className="py-3">User preferences</td>
                      <td className="py-3">1 year</td>
                      <td className="py-3"><span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Functionality</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-tx-muted mt-4">
                This list is updated periodically. Third-party cookies may change based on service providers.
              </p>
            </div>
          }
        />

        <CookieSection
          id="management"
          title="4. Managing Your Cookies"
          expandedId={expandedId}
          toggle={toggle}
          content={
            <div className="space-y-3 text-tx-secondary">
              <p>You can control cookies through your browser settings:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Most browsers let you accept, block, or delete cookies</li>
                <li>You can set your browser to notify you when cookies are set</li>
                <li>Blocking all cookies may prevent proper site functionality</li>
              </ul>
              <p className="font-semibold mt-4">
                Our cookie consent banner provides direct controls for non-essential cookies.
              </p>
            </div>
          }
        />

        <CookieSection
          id="thirdparty"
          title="5. Third-Party Cookies"
          expandedId={expandedId}
          toggle={toggle}
          content={
            <div className="space-y-3 text-tx-secondary">
              <p>
                We work with trusted third parties (like Google Analytics) that may place
                cookies on your device. These third parties have their own privacy policies.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>You can opt out of Google Analytics via their{' '}
                  <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    opt-out tool
                  </a>
                </li>
                <li>Browser plugins can block specific third-party cookies</li>
              </ul>
            </div>
          }
        />

        <CookieSection
          id="changes"
          title="6. Updates to This Policy"
          expandedId={expandedId}
          toggle={toggle}
          content={
            <div className="space-y-3 text-tx-secondary">
              <p>
                We may update this Cookie Policy from time to time. Significant changes
                will be communicated via our website and cookie consent banner.
              </p>
              <p>
                Continued use of our services after changes constitutes acceptance of
                the updated policy.
              </p>
            </div>
          }
        />

        <CookieSection
          id="contact"
          title="7. Contact Us"
          expandedId={expandedId}
          toggle={toggle}
          content={
            <div className="space-y-3 text-tx-secondary">
              <p className="font-semibold">
                Questions about our Cookie Policy? Contact us at{' '}
                <a href="mailto:support@propertech.co.ke" className="text-blue-600 hover:underline">
                  support@propertech.co.ke
                </a>
              </p>
              <p className="text-sm text-tx-muted">
                Last updated: December 12, 2025
              </p>
            </div>
          }
        />
      </div>
    </div>
  )
}
