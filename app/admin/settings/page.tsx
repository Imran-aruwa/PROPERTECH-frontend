'use client';
import { useRequireAuth } from '@/app/lib/auth-context';
import { SettingsPage } from '@/components/settings/SettingsPage';

export default function AdminSettingsPage() {
  useRequireAuth('admin');
  return <SettingsPage role="owner" />;
}
