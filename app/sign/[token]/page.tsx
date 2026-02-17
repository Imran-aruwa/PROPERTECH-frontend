'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { leasesApi } from '@/app/lib/api-services';
import { SignatureCanvas } from '@/components/leases/SignatureCanvas';
import { Lease } from '@/app/lib/types';
import { Building2, Check, CheckCircle, Loader2, Download, RefreshCw } from 'lucide-react';

type SigningStep = 'review' | 'sign' | 'verify' | 'complete';

export default function PublicSigningPage() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<SigningStep>('review');
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  // Sign step
  const [signTab, setSignTab] = useState<'type' | 'draw'>('type');
  const [typedName, setTypedName] = useState('');
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);

  // OTP step
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  // PDF url from completion
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchLease = async () => {
      setLoading(true);
      setError(null);
      const res = await leasesApi.getByToken(token);
      if (res.success && res.data) {
        setLease(res.data);
      } else {
        setError(res.error || 'Invalid or expired signing link');
      }
      setLoading(false);
    };
    fetchLease();
  }, [token]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSign = async () => {
    const signatureData = signTab === 'type' ? typedName : drawnSignature;
    if (!signatureData) {
      setError(signTab === 'type' ? 'Please type your name' : 'Please draw your signature');
      return;
    }
    setSigning(true);
    setError(null);
    const res = await leasesApi.sign(token, {
      signature_type: signTab === 'type' ? 'typed' : 'drawn',
      signature_data: signatureData,
      signer_name: signTab === 'type' ? typedName : '',
    });
    if (res.success) {
      setStep('verify');
      startCooldown();
    } else {
      setError(res.error || 'Failed to submit signature');
    }
    setSigning(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setVerifying(true);
    setError(null);
    const res = await leasesApi.verifyOtp(token, otp);
    if (res.success) {
      setPdfUrl(res.data?.pdf_url || null);
      setStep('complete');
    } else {
      setError(res.error || 'Invalid OTP code');
    }
    setVerifying(false);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    const res = await leasesApi.sign(token, {
      signature_type: signTab === 'type' ? 'typed' : 'drawn',
      signature_data: signTab === 'type' ? typedName : drawnSignature,
      signer_name: typedName,
      resend: true,
    });
    if (res.success) {
      startCooldown();
    } else {
      setError(res.error || 'Failed to resend code');
    }
  };

  const formatCurrency = (amount: number) => `KES ${amount?.toLocaleString() || '0'}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-gray-900">Propertech</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading lease...</p>
          </div>
        )}

        {!loading && error && step === 'review' && !lease && (
          <div className="text-center py-12 bg-white rounded-lg border p-6">
            <p className="text-red-600 font-medium">{error}</p>
            <p className="text-gray-500 text-sm mt-2">This signing link may be invalid or expired.</p>
          </div>
        )}

        {/* Step 1: Review */}
        {!loading && lease && step === 'review' && (
          <div className="bg-white rounded-lg border p-6 space-y-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Lease Agreement</h1>
              <p className="text-gray-600 text-sm mt-1">Please review the lease details below</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Property</p>
                <p className="font-medium text-gray-900">{lease.property?.name || `Property #${lease.property_id}`}</p>
              </div>
              <div>
                <p className="text-gray-500">Unit</p>
                <p className="font-medium text-gray-900">{lease.unit?.unit_number || `#${lease.unit_id}`}</p>
              </div>
              <div>
                <p className="text-gray-500">Start Date</p>
                <p className="font-medium text-gray-900">{lease.start_date}</p>
              </div>
              <div>
                <p className="text-gray-500">End Date</p>
                <p className="font-medium text-gray-900">{lease.end_date}</p>
              </div>
              <div>
                <p className="text-gray-500">Rent</p>
                <p className="font-medium text-gray-900">{formatCurrency(lease.rent_amount)}</p>
              </div>
              <div>
                <p className="text-gray-500">Deposit</p>
                <p className="font-medium text-gray-900">{formatCurrency(lease.deposit_amount)}</p>
              </div>
            </div>

            {lease.clauses && lease.clauses.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Terms & Conditions</h2>
                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {lease.clauses.map((clause, i) => (
                    <div key={clause.id || i} className="p-3">
                      <p className="text-xs font-medium text-gray-500 capitalize mb-1">{clause.type}</p>
                      <p className="text-sm text-gray-700">{clause.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">
                I have read and agree to all the terms and conditions of this lease agreement.
              </span>
            </label>

            <button
              onClick={() => { setError(null); setStep('sign'); }}
              disabled={!agreed}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Sign
            </button>
          </div>
        )}

        {/* Step 2: Sign */}
        {step === 'sign' && (
          <div className="bg-white rounded-lg border p-6 space-y-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sign Lease</h1>
              <p className="text-gray-600 text-sm mt-1">Choose how you would like to sign</p>
            </div>

            <div className="flex border-b">
              <button
                onClick={() => setSignTab('type')}
                className={`flex-1 py-2 text-sm font-medium border-b-2 ${
                  signTab === 'type' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
                }`}
              >
                Type Name
              </button>
              <button
                onClick={() => setSignTab('draw')}
                className={`flex-1 py-2 text-sm font-medium border-b-2 ${
                  signTab === 'draw' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
                }`}
              >
                Draw Signature
              </button>
            </div>

            {signTab === 'type' ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Type your full name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
                {typedName && (
                  <div className="border rounded-lg p-4 bg-gray-50 text-center">
                    <p className="text-2xl italic text-gray-800" style={{ fontFamily: 'cursive' }}>
                      {typedName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Signature preview</p>
                  </div>
                )}
              </div>
            ) : (
              <SignatureCanvas onSignatureChange={setDrawnSignature} />
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setError(null); setStep('review'); }}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleSign}
                disabled={signing}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Submit Signature
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Verify OTP */}
        {step === 'verify' && (
          <div className="bg-white rounded-lg border p-6 space-y-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Verify Your Identity</h1>
              <p className="text-gray-600 text-sm mt-1">
                Enter the 6-digit code sent to your phone/email
              </p>
            </div>

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-center text-2xl tracking-widest text-gray-900"
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={verifying || otp.length !== 6}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
            </button>

            <div className="text-center">
              <button
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 flex items-center gap-1 mx-auto"
              >
                <RefreshCw className="w-3 h-3" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="bg-white rounded-lg border p-6 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h1 className="text-xl font-bold text-gray-900">Lease Signed Successfully</h1>
            <p className="text-gray-600">
              Your lease agreement has been signed and verified. You will receive a confirmation shortly.
            </p>
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                <Download className="w-4 h-4" /> Download PDF
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
