// ============================================
// FILE: components/layout/Sidebar.tsx
// ============================================
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  DollarSign,
  Users,
  Wrench,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  TrendingUp,
  Home,
  CreditCard,
  Clock,
  AlertTriangle,
  Timer,
  MessageSquare,
  Shield,
  Leaf,
  Briefcase,
  Package,
  CheckSquare,
} from 'lucide-react';

interface SidebarProps {
  role: 'owner' | 'agent' | 'caretaker' | 'tenant' | 'security' | 'gardener';
  isOpen: boolean;
  onClose: () => void;
}

const navigationConfig = {
  owner: [
    { name: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
    { name: 'Properties', href: '/owner/properties', icon: Building2 },
    { name: 'Rent Tracking', href: '/owner/rent-tracking', icon: DollarSign },
    { name: 'Analytics', href: '/owner/analytics', icon: TrendingUp },
    { name: 'Reports', href: '/owner/reports', icon: FileText },
    { name: 'Vacancy Alerts', href: '/owner/vacancy-alerts', icon: AlertTriangle },
    { name: 'SLA Tracking', href: '/owner/maintenance-sla', icon: Timer },
    { name: 'Rent Chasing', href: '/owner/rent-chasing', icon: MessageSquare },
    { name: 'Settings', href: '/owner/settings', icon: Settings },
  ],
  agent: [
    { name: 'Dashboard', href: '/agent/dashboard', icon: LayoutDashboard },
    { name: 'Properties', href: '/agent/properties', icon: Building2 },
    { name: 'Earnings', href: '/agent/earnings', icon: DollarSign },
    { name: 'Rent Collection', href: '/agent/rent-collection', icon: CreditCard },
    { name: 'Tenants', href: '/agent/tenants', icon: Users },
    { name: 'Settings', href: '/agent/settings', icon: Settings },
  ],
  caretaker: [
    { name: 'Dashboard', href: '/caretaker/dashboard', icon: LayoutDashboard },
    { name: 'Rent Tracking', href: '/caretaker/rent-tracking', icon: DollarSign },
    { name: 'Outstanding', href: '/caretaker/outstanding-payments', icon: Clock },
    { name: 'Meter Readings', href: '/caretaker/meter-readings', icon: TrendingUp },
    { name: 'Maintenance', href: '/caretaker/maintenance', icon: Wrench },
    { name: 'My Performance', href: '/caretaker/performance', icon: Timer },
    { name: 'Rent Chasing', href: '/caretaker/rent-chasing', icon: MessageSquare },
    { name: 'Tenants', href: '/caretaker/tenants', icon: Users },
    { name: 'Settings', href: '/caretaker/settings', icon: Settings },
  ],
  tenant: [
    { name: 'Dashboard', href: '/tenant/dashboard', icon: LayoutDashboard },
    { name: 'Payment History', href: '/tenant/payments', icon: CreditCard },
    { name: 'Maintenance', href: '/tenant/maintenance', icon: Wrench },
    { name: 'Documents', href: '/tenant/documents', icon: FileText },
    { name: 'Profile', href: '/tenant/profile', icon: Settings },
  ],
  security: [
    { name: 'Dashboard', href: '/staff/security/dashboard', icon: LayoutDashboard },
    { name: 'Incidents', href: '/staff/security/incidents', icon: AlertTriangle },
    { name: 'Attendance', href: '/staff/security/attendance', icon: Clock },
    { name: 'Performance', href: '/staff/security/performance', icon: TrendingUp },
  ],
  gardener: [
    { name: 'Dashboard', href: '/staff/gardener/dashboard', icon: LayoutDashboard },
    { name: 'Assignments', href: '/staff/gardener/assignments', icon: Briefcase },
    { name: 'Equipment', href: '/staff/gardener/equipment', icon: Package },
    { name: 'Tasks', href: '/staff/gardener/tasks', icon: CheckSquare },
  ],
};

const roleIcons = {
  owner: Building2,
  agent: Users,
  caretaker: Home,
  tenant: Users,
  security: Shield,
  gardener: Leaf,
};

const roleTitles = {
  owner: 'Owner Portal',
  agent: 'Agent Portal',
  caretaker: 'Caretaker Portal',
  tenant: 'Tenant Portal',
  security: 'Security Portal',
  gardener: 'Gardener Portal',
};

export function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navigation = navigationConfig[role];
  const RoleIcon = roleIcons[role];

  const handleLogout = () => {
    // Clear all auth data from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user_role');
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('role');

    // Redirect to login page
    router.push('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <RoleIcon className="h-7 w-7 text-blue-600" />
              <span className="text-lg font-bold text-gray-900">
                {roleTitles[role]}
              </span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto sidebar-nav px-3 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}