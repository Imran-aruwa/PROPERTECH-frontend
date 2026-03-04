'use client'

import { useState } from 'react'
import { ChevronDown, FileText, Shield } from 'lucide-react'

function TermsSection({
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

export default function TermsPage() {
  const [expandedId, setExpandedId] = useState<string | null>('intro')

  const toggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-blue-100 text-lg">
            Please read these terms carefully before using Propertech Software
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 mt-8 pb-12 space-y-6">
        <TermsSection
          id="intro"
          title="1. Agreement to Terms"
          expandedId={expandedId}
          toggle={toggle}
          content={
            <div className="space-y-3 text-tx-secondary">
              <p>
                These Terms of Service govern your access to and use of the
                Propertech Software platform, including our website,
                applications, and related services (collectively, the "Service").
              </p>
              <p>
                By creating an account, accessing, or using the Service, you
                confirm that you have read, understood, and agree to be bound by
                these Terms. If you do not agree, you must not use the Service.
              </p>
            </div>
          }
        />

        <TermsSection
          id="eligibility"
          title="2. Eligibility and Account Registration"
          expandedId={expandedId}
          toggle={toggle}
          content={
            <div className="space-y-3 text-tx-secondary">
              <p>To use the Service, you represent and warrant that:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>You are at least 18 years old or the age of majority in your jurisdiction.</li>
                <li>You have the legal authority to enter into these Terms on behalf of yourself or your organization.</li>
                <li>
                  The information you provide during registration is accurate,
                  complete, and kept up to date.
                </li>
              </ul>
              <p>
                You are responsible for maintaining the confidentiality of your
                credentials and for all activities that occur under your
                account.
              </p>
            </div>
          }
        />

        <TermsSection
          id="license"
          title="3. License and Acceptable Use"
          expandedId={expandedId}
          toggle={toggle}
          content={
            <div className="space-y-3 text-tx-secondary">
              <p>
                Propertech Software grants you a limited, non-exclusive,
                non-transferable, revocable license to access and use the
                Service for your internal business purposes in accordance with
                these Terms.
              </p>
              <p>You agree that you will not:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Reverse engineer, decompile, or attempt to derive source code from the Service.</li>
                <li>Bypass, disable, or interfere with security or access controls.</li>
                <li>Use the Service to transmit spam, malicious code, or unlawful content.</li>
                <li>Misrepresent your identity or affiliation with any person or entity.</li>
                <li>Use the Service for any purpose that violates applicable laws or regulations.</li>
              </ul>
            </div>
          }
        />

        <TermsSection
          id="subscriptions"
          title="4. Subscriptions, Billing, and Renewals"
          expandedId={expandedId}
          toggle={toggle}
          content={
            <div className="space-y-3 text-tx-secondary">
              <p>
                Access to certain features of the Service may require a paid
                subscription. When you activate a subscription, you authorize
                Propertech Software and its payment processors to charge your
                selected payment method for the applicable fees.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Subscriptions renew automatically at the end of each billing cycle unless cancelled.</li>
                <li>You can manage or cancel your subscription from your account settings.</li>
                <li>Unless required by law, fees are non-refundable once charged.</li>
                <li>
                  We may adjust pricing in the future. Any changes will be
                  communicated in advance, and continued use after the change
                  constitutes acceptance.
                </li>
              </ul>
            </div>
          }
        />

        <TermsSection
          id="data"
          title="5. Data, Privacy, and Security"
          expandedId={expandedId}
          toggle={toggle}
          content={
            <div className="space-y-3 text-tx-secondary">
              <p>
                Your use of the Service is also governed by our{' '}
                <a href="/privacy" className="text-blue-600 hover:underline font-medium">
                  Privacy Policy
                </a>
                , which explains how we collect, use, and protect your
                information.
              </p>
              <p>
                By using the Service, you acknowledge that you have reviewed our
                Privacy Policy and agree that we may process your data as
                described there.
              </p>
              <p>
                You are responsible for ensuring that your use of the Service
                complies with any data protection or privacy obligations that
                apply to your business.
              </p>
            </div>
          }
        />

        <TermsSection
          id="ip"
          title="6. Intellectual Property"
          expandedId={expandedId}
          toggle={toggle}
          content={
            <div className="space-y-3 text-tx-secondary">
              <p>
                All content and materials within the Service, including software,
                designs, text, graphics, logos, and trademarks, are owned by
                Propertech Software or our licensors and are protected by
                intellectual property laws.
              </p>
              <p>
                You may not use our branding, trademarks, or content without
                prior written permission, except as expressly allowed by these
                Terms.
              </p>
              <p>
                You retain ownership of the data and content you upload to the
                Service. You grant Propertech Software a limited license to use
                that content solely to provide and improve the Service.
              </p>
            </div>
          }
        />

        <TermsSection
          id="termination"
          title="7. Suspension and Termination"
          expandedId={expandedId}
          toggle={toggle}
          content={
            <div className="space-y-3 text-tx-secondary">
              <p>
                We may suspend or terminate your access to the Service at any
                time if we reasonably believe that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>You have materially violated these Terms.</li>
                <li>Your use poses a security risk or may harm other users.</li>
                <li>Payment for your subscription is overdue and cannot be collected.</li>
                <li>We are required to do so by law or regulation.</li>
              </ul>
              <p>
                Upon termination, your right to use the Service will immediately
                cease, but provisions that by their nature should survive will
                remain in effect (including ownership, payment obligations, and
                limitations of liability).
              </p>
            </div>
          }
        />

        <TermsSection
          id="disclaimers"
          title="8. Disclaimers and Limitation of Liability"
          expandedId={expandedId}
          toggle={toggle}
          content={
            <div className="space-y-3 text-tx-secondary">
              <p className="font-semibold">
                The Service is provided "as is" and "as available" without
                warranties of any kind, either express or implied.
              </p>
              <p>
                To the fullest extent permitted by law, Propertech Software and
                its affiliates shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages, including loss of
                profits, data, or goodwill.
              </p>
              <p>
                Our total liability to you for any claim arising from these Terms
                or your use of the Service is limited to the amount you paid us
                in the twelve (12) months preceding the claim.
              </p>
            </div>
          }
        />

        <TermsSection
          id="indemnity"
          title="9. Indemnification"
          expandedId={expandedId}
          toggle={toggle}
          content={
            <div className="space-y-3 text-tx-secondary">
              <p>
                You agree to indemnify, defend, and hold harmless Propertech
                Software and its affiliates from any claims, losses, damages,
                liabilities, costs, and expenses arising from:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Your use of the Service or violation of these Terms.</li>
                <li>Your violation of any third-party rights or applicable laws.</li>
                <li>Any content you upload or transmit through the Service.</li>
              </ul>
            </div>
          }
        />

        <TermsSection
          id="changes"
          title="10. Changes to Terms"
          expandedId={expandedId}
          toggle={toggle}
          content={
            <div className="space-y-3 text-tx-secondary">
              <p>
                We may update these Terms from time to time. We will notify you
                of material changes by posting the updated Terms on our website
                and updating the "Last Updated" date at the top of this page.
              </p>
              <p>
                Your continued use of the Service after changes take effect
                constitutes your acceptance of the revised Terms.
              </p>
            </div>
          }
        />

        <TermsSection
          id="governing"
          title="11. Governing Law and Dispute Resolution"
          expandedId={expandedId}
          toggle={toggle}
          content={
            <div className="space-y-3 text-tx-secondary">
              <p>
                These Terms are governed by the laws of the Republic of Kenya,
                without regard to conflict of law principles.
              </p>
              <p>
                Any disputes arising from these Terms or your use of the Service
                shall be resolved exclusively in the courts located in Nairobi,
                Kenya.
              </p>
            </div>
          }
        />

        <TermsSection
          id="misc"
          title="12. Miscellaneous"
          expandedId={expandedId}
          toggle={toggle}
          content={
            <div className="space-y-3 text-tx-secondary">
              <p>These Terms constitute the entire agreement between you and Propertech Software.</p>
              <p>
                If any provision is found invalid, the remaining provisions
                remain in full effect.
              </p>
              <p className="font-semibold">
                Questions about these Terms? Contact us at{' '}
                <a href="mailto:support@propertech.co.ke" className="text-blue-600 hover:underline">
                  support@propertech.co.ke
                </a>
              </p>
            </div>
          }
        />
      </div>
    </div>
  )
}
