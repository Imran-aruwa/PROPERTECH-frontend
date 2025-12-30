'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  User, Bell, Lock, Shield, Trash2,
  Save, Loader2, Eye, EyeOff, Check, AlertTriangle,
  Mail, Phone, Camera
} from 'lucide-react';
import { settingsApi } from '@/app/lib/api-services';

type TabType = 'profile' | 'notifications' | 'security';

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
}

interface NotificationSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  task_reminders: boolean;
  payment_alerts: boolean;
  maintenance_updates: boolean;
}

interface SettingsPageProps {
  role: 'owner' | 'agent' | 'caretaker' | 'tenant' | 'security' | 'gardener';
}

export function SettingsPage({ role }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_notifications: true,
    sms_notifications: true,
    push_notifications: true,
    task_reminders: true,
    payment_alerts: true,
    maintenance_updates: true,
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const profileResponse = await settingsApi.getProfile();
      if (profileResponse.success && profileResponse.data) {
        setProfile(prev => ({ ...prev, ...profileResponse.data }));
      } else {
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setProfile({
            full_name: userData.full_name || '',
            email: userData.email || '',
            phone: userData.phone || '',
          });
        }
      }

      const notifResponse = await settingsApi.getNotifications();
      if (notifResponse.success && notifResponse.data) {
        setNotifications(prev => ({ ...prev, ...notifResponse.data }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await settingsApi.updateProfile(profile);
      if (response.success) {
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          localStorage.setItem('auth_user', JSON.stringify({
            ...userData,
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
          }));
        }
        showMessage('success', 'Profile updated successfully');
      } else {
        showMessage('error', response.error || 'Failed to update profile');
      }
    } catch (error) {
      showMessage('error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      const response = await settingsApi.updateNotifications(notifications);
      if (response.success) {
        showMessage('success', 'Notification preferences updated');
      } else {
        showMessage('error', response.error || 'Failed to update notifications');
      }
    } catch (error) {
      showMessage('error', 'Failed to update notifications');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      showMessage('error', 'Password must be at least 8 characters');
      return;
    }

    setIsSaving(true);
    try {
      const response = await settingsApi.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      if (response.success) {
        showMessage('success', 'Password changed successfully');
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        showMessage('error', response.error || 'Failed to change password');
      }
    } catch (error) {
      showMessage('error', 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showMessage('error', 'Please type DELETE to confirm');
      return;
    }

    setIsSaving(true);
    try {
      const response = await settingsApi.deleteAccount();
      if (response.success) {
        localStorage.clear();
        window.location.href = '/login';
      } else {
        showMessage('error', response.error || 'Failed to delete account');
      }
    } catch (error) {
      showMessage('error', 'Failed to delete account');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile' as TabType, label: 'Profile', icon: User },
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell },
    { id: 'security' as TabType, label: 'Security', icon: Lock },
  ];

  if (isLoading) {
    return (
      <DashboardLayout role={role}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and preferences</p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            )}
            <p>{message.text}</p>
          </div>
        )}

        <div className="flex gap-1 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap border-b-2 -mb-[2px] ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md border hover:bg-gray-50">
                    <Camera className="w-3 h-3 text-gray-600" />
                  </button>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-semibold text-gray-900">{profile.full_name || 'Your Name'}</h3>
                  <p className="text-gray-600 text-sm">{profile.email}</p>
                  <p className="text-xs text-gray-500 capitalize mt-1">{role} Account</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+254 700 000 000"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Notification Preferences
            </h2>

            <div className="space-y-4">
              {[
                { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                { key: 'sms_notifications', label: 'SMS Notifications', desc: 'Receive SMS alerts' },
                { key: 'push_notifications', label: 'Push Notifications', desc: 'Browser push notifications' },
                { key: 'task_reminders', label: 'Task Reminders', desc: 'Reminders for pending tasks' },
                { key: 'payment_alerts', label: 'Payment Alerts', desc: 'Payment related notifications' },
                { key: 'maintenance_updates', label: 'Maintenance Updates', desc: 'Maintenance request updates' },
              ].map((item) => (
                <label key={item.key} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={notifications[item.key as keyof NotificationSettings]}
                    onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded mt-0.5"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveNotifications}
                disabled={isSaving}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Change Password
              </h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={isSaving || !passwordForm.current_password || !passwordForm.new_password}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                  Update Password
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Two-Factor Authentication
              </h2>
              <p className="text-gray-600 mb-4">Add an extra layer of security to your account</p>
              <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                Enable 2FA
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Delete Account
              </h2>
              <p className="text-gray-600 mb-4">
                Permanently delete your account and all associated data.
              </p>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              ) : (
                <div className="space-y-4 max-w-md">
                  <p className="text-sm text-red-600 font-medium">Type DELETE to confirm</p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-4 py-2.5 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="Type DELETE"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isSaving || deleteConfirmText !== 'DELETE'}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Delete'}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
