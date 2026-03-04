// FILE: app/(public)/privacy-policies/page.tsx
// Complete Privacy & Policies Page for Propertech Software

'use client';

import { useState } from 'react';
import { ChevronDown, Lock, Shield, FileText } from 'lucide-react';

export default function PrivacyPoliciesPage() {
  const [expandedSection, setExpandedSection] = useState<string>('privacy');
  const [expandedTab, setExpandedTab] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedTab(expandedTab === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Privacy & Policies</h1>
          </div>
          <p className="text-blue-100 text-lg">
            Your privacy and trust are our top priorities
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="flex gap-4 mb-8 border-b border-bd">
          <button
            onClick={() => setExpandedSection('privacy')}
            className={`pb-4 px-2 font-semibold transition-colors ${
              expandedSection === 'privacy'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-tx-secondary hover:text-tx-primary'
            }`}
          >
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Privacy Policy
            </div>
          </button>
          <button
            onClick={() => setExpandedSection('terms')}
            className={`pb-4 px-2 font-semibold transition-colors ${
              expandedSection === 'terms'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-tx-secondary hover:text-tx-primary'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Terms of Service
            </div>
          </button>
        </div>

        {/* Privacy Policy Section */}
        {expandedSection === 'privacy' && (
          <div className="space-y-6 pb-12">
            {/* Introduction */}
            <PolicySection
              title="1. Introduction"
              content="PROPERTECH SOFTWARE ('we', 'us', 'our', or 'Company') operates the Propertech Software website and mobile application. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data."
              id="intro"
              expanded={expandedTab}
              toggle={toggleExpand}
            />

            {/* Data Collection */}
            <PolicySection
              title="2. Information Collection and Use"
              content={
                <div className="space-y-3 text-tx-secondary">
                  <p>
                    We collect various types of information in connection with the services we provide, including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li><strong>Personal Information:</strong> Name, email address, phone number, physical address, business information</li>
                    <li><strong>Account Information:</strong> Login credentials, password, subscription details, payment information</li>
                    <li><strong>Property Data:</strong> Unit information, tenant details, financial records, maintenance logs</li>
                    <li><strong>Usage Data:</strong> IP address, browser type, pages visited, time spent, device information</li>
                    <li><strong>Cookies & Tracking:</strong> Session information, user preferences, activity tracking</li>
                    <li><strong>Communication:</strong> Messages, support tickets, feedback, surveys</li>
                  </ul>
                </div>
              }
              id="collection"
              expanded={expandedTab}
              toggle={toggleExpand}
            />

            {/* Use of Data */}
            <PolicySection
              title="3. Use of Data"
              content={
                <div className="space-y-3 text-tx-secondary">
                  <p>Propertech software uses the collected data for various purposes:</p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>To provide and maintain our Service</li>
                    <li>To notify you about changes to our Service</li>
                    <li>To allow you to participate in interactive features</li>
                    <li>To provide customer support and respond to inquiries</li>
                    <li>To gather analysis or valuable information to improve our Service</li>
                    <li>To monitor the usage of our Service</li>
                    <li>To detect, prevent and address technical and security issues</li>
                    <li>To provide you with news, special offers, and general information</li>
                    <li>For business operations and analytics</li>
                  </ul>
                </div>
              }
              id="use"
              expanded={expandedTab}
              toggle={toggleExpand}
            />

            {/* Security */}
            <PolicySection
              title="4. Security of Data"
              content={
                <div className="space-y-3 text-tx-secondary">
                  <p>
                    We implement appropriate technical and organizational measures designed to protect personal information against accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access. These measures include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>256-bit SSL/TLS encryption for all data in transit</li>
                    <li>AES-256 encryption for data at rest</li>
                    <li>Multi-factor authentication (MFA) support</li>
                    <li>Regular security audits and penetration testing</li>
                    <li>Role-based access control (RBAC)</li>
                    <li>Regular backup and disaster recovery procedures</li>
                    <li>Compliance with GDPR, CCPA, and other data protection regulations</li>
                  </ul>
                  <p className="mt-4 text-sm text-tx-secondary">
                    Note: While we implement robust security measures, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security of your personal information.
                  </p>
                </div>
              }
              id="security"
              expanded={expandedTab}
              toggle={toggleExpand}
            />

            {/* Data Retention */}
            <PolicySection
              title="5. Data Retention"
              content={
                <div className="space-y-3 text-tx-secondary">
                  <p>
                    Propertech Software will retain your personal data only for as long as necessary for the purposes set out in this Privacy Policy:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
                    <li><strong>After Account Closure:</strong> Data retained for 30 days to allow account recovery</li>
                    <li><strong>Legal Requirements:</strong> Data retained as required by law (typically 7 years for financial records)</li>
                    <li><strong>Dispute Resolution:</strong> Data retained until disputes are resolved</li>
                    <li><strong>Backup Copies:</strong> May be retained in backups for up to 90 days</li>
                  </ul>
                </div>
              }
              id="retention"
              expanded={expandedTab}
              toggle={toggleExpand}
            />

            {/* Your Rights */}
            <PolicySection
              title="6. Your Privacy Rights"
              content={
                <div className="space-y-3 text-tx-secondary">
                  <p>Depending on your location, you may have certain rights regarding your personal data:</p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                    <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                    <li><strong>Right to Erasure:</strong> Request deletion of your data ('right to be forgotten')</li>
                    <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                    <li><strong>Right to Data Portability:</strong> Receive your data in machine-readable format</li>
                    <li><strong>Right to Object:</strong> Object to processing for specific purposes</li>
                    <li><strong>Right to Withdraw Consent:</strong> Withdraw previously given consent</li>
                  </ul>
                  <p className="mt-4">
                    To exercise any of these rights, please contact us at <strong>privacy@propertechsoftware.com</strong>
                  </p>
                </div>
              }
              id="rights"
              expanded={expandedTab}
              toggle={toggleExpand}
            />

            {/* Third Parties */}
            <PolicySection
              title="7. Sharing with Third Parties"
              content={
                <div className="space-y-3 text-tx-secondary">
                  <p>
                    We do not sell, trade, or rent your personal information to third parties. However, we may share data:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li><strong>Service Providers:</strong> With vendors who assist us (hosting, analytics, payment processing)</li>
                    <li><strong>Legal Compliance:</strong> When required by law or court order</li>
                    <li><strong>Protection:</strong> To protect our rights, privacy, safety, or property</li>
                    <li><strong>Business Transfer:</strong> In case of merger, acquisition, or bankruptcy</li>
                    <li><strong>With Consent:</strong> When you explicitly authorize us to do so</li>
                  </ul>
                  <p className="mt-4">
                    All third-party service providers are contractually obligated to keep your information confidential and secure.
                  </p>
                </div>
              }
              id="thirdparties"
              expanded={expandedTab}
              toggle={toggleExpand}
            />

            {/* Contact */}
            <PolicySection
              title="8. Contact Us"
              content={
                <div className="space-y-3 text-tx-secondary">
                  <p>
                    If you have any questions about this Privacy Policy or our privacy practices, please contact us:
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <p>
                      <strong>Email:</strong> <a href="mailto:privacy@propertechsoftware.com" className="text-blue-600 hover:underline">privacy@propertechsoftware.com</a>
                    </p>
                    <p>
                      <strong>Address:</strong> Propertech Software, Nairobi, Kenya
                    </p>
                    <p>
                      <strong>Web:</strong> <a href="https://propertechsoftware.com" className="text-blue-600 hover:underline">https://propertechsoftware.com</a>
                    </p>
                  </div>
                </div>
              }
              id="contact"
              expanded={expandedTab}
              toggle={toggleExpand}
            />
          </div>
        )}

        {/* Terms of Service Section */}
        {expandedSection === 'terms' && (
          <div className="space-y-6 pb-12">
            {/* Introduction */}
            <PolicySection
              title="1. Terms and Conditions"
              content="Welcome to Propertech Software. These Terms of Service ('Terms') govern your use of our website, mobile applications, and services. By accessing or using Propertech Software, you agree to be bound by these Terms. If you do not agree, please do not use our Service."
              id="tos-intro"
              expanded={expandedTab}
              toggle={toggleExpand}
            />

            {/* Use License */}
            <PolicySection
              title="2. License to Use"
              content={
                <div className="space-y-3 text-tx-secondary">
                  <p>
                    Propertech Software grants you a limited, non-exclusive, revocable license to use our Service for lawful purposes only. You agree not to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>Reproduce, duplicate, copy, or resell any portion of our Service</li>
                    <li>Modify, adapt, or hack the Service or create derivative works</li>
                    <li>Remove any copyright, trademark, or other proprietary notices</li>
                    <li>Access or search the Service by any means other than our publicly supported interfaces</li>
                    <li>Use the Service for illegal purposes or in violation of any laws</li>
                    <li>Attempt to gain unauthorized access to the Service or its infrastructure</li>
                    <li>Harass, threaten, defame, or abuse other users</li>
                  </ul>
                </div>
              }
              id="license"
              expanded={expandedTab}
              toggle={toggleExpand}
            />

            {/* User Accounts */}
            <PolicySection
              title="3. User Accounts"
              content={
                <div className="space-y-3 text-tx-secondary">
                  <p>
                    When you create an account with Propertech Software, you are responsible for:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>Providing accurate, current, and complete information</li>
                    <li>Maintaining the confidentiality of your password and account credentials</li>
                    <li>Accepting responsibility for all activities under your account</li>
                    <li>Notifying us immediately of any unauthorized use of your account</li>
                    <li>Complying with all applicable laws and regulations</li>
                  </ul>
                  <p className="mt-4">
                    Propertech Software reserves the right to suspend or terminate accounts that violate these Terms or engage in unlawful activities.
                  </p>
                </div>
              }
              id="accounts"
              expanded={expandedTab}
              toggle={toggleExpand}
            />

            {/* Intellectual Property */}
            <PolicySection
              title="4. Intellectual Property Rights"
              content={
                <div className="space-y-3 text-tx-secondary">
                  <p>
                    The Service and its entire contents, features, and functionality (including all information, software, text, displays, images, video, and audio) are owned by Propertech Software, its licensors, or other providers of such material and are protected by copyright, trademark, and other intellectual property laws.
                  </p>
                  <p>
                    Your use of the Service does not grant you ownership or rights to any intellectual property within it.
                  </p>
                  <p>
                    You retain all rights to any content you submit, upload, or display on Propertech software, and you grant Propertech Software a worldwide, non-exclusive license to use such content.
                  </p>
                </div>
              }
              id="ip"
              expanded={expandedTab}
              toggle={toggleExpand}
            />

            {/* Payments and Billing */}
            <PolicySection
              title="5. Payments and Billing"
              content={
                <div className="space-y-3 text-tx-secondary">
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li><strong>Payment Method:</strong> We accept payments via Paystack. You authorize us to charge your payment method</li>
                    <li><strong>Billing Cycles:</strong> Subscriptions renew automatically unless cancelled before renewal</li>
                    <li><strong>Refunds:</strong> All payments are final. Refunds are provided only when required by law</li>
                    <li><strong>Price Changes:</strong> We may change pricing with 30 days notice. Continued use constitutes acceptance</li>
                    <li><strong>Late Payments:</strong> Non-payment may result in service suspension</li>
                    <li><strong>Taxes:</strong> You are responsible for applicable taxes on your subscription</li>
                  </ul>
                </div>
              }
              id="payments"
              expanded={expandedTab}
              toggle={toggleExpand}
            />

            {/* Warranty Disclaimer */}
            <PolicySection
              title="6. Disclaimer of Warranties"
              content={
                <div className="space-y-3 text-tx-secondary">
                  <p>
                    THE SERVICE IS PROVIDED 'AS IS' AND 'AS AVAILABLE' WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. PROPERTECH SOFTWARE DISCLAIMS ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                  </p>
                  <p>
                    PROPERTECH SOFTWARE does not warrant that the Service will be uninterrupted, error-free, or free from viruses or harmful components.
                  </p>
                </div>
              }
              id="warranty"
              expanded={expandedTab}
              toggle={toggleExpand}
            />

            {/* Limitation of Liability */}
            <PolicySection
              title="7. Limitation of Liability"
              content={
                <div className="space-y-3 text-tx-secondary">
                  <p>
                    IN NO EVENT SHALL PROPERTECH SOFTWARE, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES RESULTING FROM:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>Your use of or inability to use the Service</li>
                    <li>Unauthorized access or alteration of your data</li>
                    <li>Loss of profits, revenue, or data</li>
                    <li>Service interruptions or delays</li>
                    <li>Third-party conduct or content</li>
                  </ul>
                </div>
              }
              id="liability"
              expanded={expandedTab}
              toggle={toggleExpand}
            />

            {/* Changes to Terms */}
            <PolicySection
              title="8. Modifications to Terms"
              content={
                <div className="space-y-3 text-tx-secondary">
                  <p>
                    Propertech Software may modify these Terms at any time. We will notify users of significant changes via email or prominently on our website. Your continued use of the Service constitutes acceptance of modified Terms.
                  </p>
                  <p>
                    Last Updated: {new Date().toLocaleDateString()}
                  </p>
                </div>
              }
              id="changes"
              expanded={expandedTab}
              toggle={toggleExpand}
            />

            {/* Termination */}
            <PolicySection
              title="9. Termination"
              content={
                <div className="space-y-3 text-tx-secondary">
                  <p>
                    Propertech Software may suspend or terminate your account and access to the Service immediately, without prior notice or liability, if:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>You violate these Terms or any applicable laws</li>
                    <li>You engage in unlawful or harmful conduct</li>
                    <li>Your account payment is not received</li>
                    <li>We believe it necessary to protect our users or infrastructure</li>
                  </ul>
                </div>
              }
              id="termination"
              expanded={expandedTab}
              toggle={toggleExpand}
            />

            {/* Governing Law */}
            <PolicySection
              title="10. Governing Law"
              content={
                <div className="space-y-3 text-tx-secondary">
                  <p>
                    These Terms are governed by and construed in accordance with the laws of Kenya, without regard to its conflict of law provisions. Any legal action or proceeding shall be brought exclusively in the courts of Nairobi, Kenya.
                  </p>
                </div>
              }
              id="law"
              expanded={expandedTab}
              toggle={toggleExpand}
            />

            {/* Contact for Terms */}
            <PolicySection
              title="11. Contact for Terms Questions"
              content={
                <div className="space-y-3 text-tx-secondary">
                  <p>
                    If you have any questions about these Terms of Service, please contact us:
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <p>
                      <strong>Email:</strong> <a href="mailto:legal@propertechsoftware.com" className="text-blue-600 hover:underline">legal@propertechsoftware.com</a>
                    </p>
                    <p>
                      <strong>Address:</strong> Propertech Software, Nairobi, Kenya
                    </p>
                    <p>
                      <strong>Web:</strong> <a href="https://propertechsoftware.com" className="text-blue-600 hover:underline">https://propertechsoftware.com</a>
                    </p>
                  </div>
                </div>
              }
              id="contact-terms"
              expanded={expandedTab}
              toggle={toggleExpand}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-bg-secondary border-t border-bd mt-12">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-tx-secondary text-center">
            © 2025 PROPERTECH SOFTWARE. All rights reserved.
          </p>
          <p className="text-tx-muted text-center text-sm mt-2">
            Last Updated: {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

// Reusable PolicySection Component
function PolicySection({
  title,
  content,
  id,
  expanded,
  toggle,
}: {
  title: string;
  content: string | React.ReactNode;
  id: string;
  expanded: string | null;
  toggle: (id: string) => void;
}) {
  const isExpanded = expanded === id;

  return (
    <div className="bg-bg-card border border-bd rounded-lg overflow-hidden">
      <button
        onClick={() => toggle(id)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-bg-hover transition-colors"
      >
        <h3 className="text-lg font-semibold text-tx-primary text-left">{title}</h3>
        <ChevronDown
          className={`w-5 h-5 text-tx-muted transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="px-6 py-4 border-t border-bd bg-bg-secondary">
          <div className="text-tx-secondary">
            {typeof content === 'string' ? <p>{content}</p> : content}
          </div>
        </div>
      )}
    </div>
  );
}


