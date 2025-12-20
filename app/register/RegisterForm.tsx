'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { Building2, Mail, Lock, User, Phone, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { authApi } from '@/app/lib/api-services';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  phone: string;
  role: 'owner' | 'agent';
  plan?: string;
}

export default function RegisterForm() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuth();
  const searchParams = useSearchParams();

  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('freemium');
  const [values, setValues] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    role: 'owner',
    plan: 'freemium',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof RegisterFormData, boolean>>>({});
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && role) {
      const roleRedirects: Record<string, string> = {
        owner: '/owner',
        agent: '/agent',
        tenant: '/tenant',
        staff: '/staff',
        caretaker: '/caretaker',
        admin: '/admin',
      };
      const redirectPath = roleRedirects[role.toLowerCase()] || '/';
      router.push(redirectPath);
    }
  }, [isAuthenticated, role, router]);

  // Read plan + role from URL
  useEffect(() => {
    const plan = searchParams.get('plan');
    const roleFromUrl = searchParams.get('role') as 'owner' | 'agent' | null;

    setValues(prev => ({
      ...prev,
      plan: plan ? plan.toLowerCase() : prev.plan,
      role: roleFromUrl === 'owner' || roleFromUrl === 'agent' ? roleFromUrl : prev.role,
    }));

    if (plan) {
      setSelectedPlan(plan.toLowerCase());
    }
  }, [searchParams]);

  const validateForm = (data: RegisterFormData) => {
    const newErrors: Partial<Record<keyof RegisterFormData, string>> = {};

    if (!data.full_name || data.full_name.trim().length < 3) {
      newErrors.full_name = 'Full name must be at least 3 characters';
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!data.password || data.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (data.phone && !/^\+?[\d\s-()]+$/.test(data.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));

    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleRoleChange = (role: 'owner' | 'agent') => {
    setValues(prev => ({ ...prev, role }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validateForm(values);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setTouched({
        email: true,
        password: true,
        confirmPassword: true,
        full_name: true,
        phone: true,
      });
      return;
    }

    try {
      setSubmitting(true);
      const { confirmPassword, ...registerData } = {
        ...values,
        plan: selectedPlan,
      };

      const response = await authApi.register(registerData);

      if (response.success) {
        setToastMessage({ type: 'success', message: 'Account created successfully! Redirecting to login...' });

        // Redirect to login page after successful signup
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        setToastMessage({ type: 'error', message: response.error || 'Registration failed. Please try again.' });
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', message: err.message || 'Registration failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses = (fieldName: keyof RegisterFormData) =>
    `w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
      touched[fieldName] && errors[fieldName]
        ? 'border-red-500'
        : 'border-gray-300'
    }`;

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            toastMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white animate-in slide-in-from-top-2 duration-300`}
        >
          {toastMessage.message}
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Propertech Software
          </h1>
          <p className="text-gray-600">Create your account</p>

          <div className="mt-3 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
            <BadgeCheck className="w-4 h-4" />
            Selected Plan: {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="full_name"
                  value={values.full_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClasses('full_name')}
                  placeholder="John Doe"
                />
              </div>
              {touched.full_name && errors.full_name && (
                <p className="mt-1 text-sm text-red-500">{errors.full_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClasses('email')}
                  placeholder="you@example.com"
                />
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={values.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClasses('phone')}
                  placeholder="+254 700 123 456"
                />
              </div>
              {touched.phone && errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClasses('password')}
                  placeholder="Enter your password"
                  style={{ WebkitTextFillColor: '#111827', color: '#111827' }}
                />
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClasses('confirmPassword')}
                  placeholder="Confirm your password"
                  style={{ WebkitTextFillColor: '#111827', color: '#111827' }}
                />
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <div className="flex gap-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="owner"
                    checked={values.role === 'owner'}
                    onChange={() => handleRoleChange('owner')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Property Owner</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="agent"
                    checked={values.role === 'agent'}
                    onChange={() => handleRoleChange('agent')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Real Estate Agent</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}