'use client';
import { useRequireAuth } from '@/app/lib/auth-context';
import { SettingsPage } from '@/components/settings/SettingsPage';

export default function TenantSettingsPage() {
  useRequireAuth('tenant');
  return <SettingsPage role="tenant" />;
}
