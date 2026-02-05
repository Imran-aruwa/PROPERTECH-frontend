'use client';

import { useAuth } from '@/app/lib/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Building2, Users, DollarSign, Wrench, UserCircle,
  BarChart, LogOut, Settings, Bell, ChevronLeft, ChevronRight,
  ClipboardList, Calendar, Target, Briefcase, ShieldAlert, AlertTriangle, Timer
} from 'lucide-react';
import { useState } from 'react';

const ownerLinks = [
  { href: '/owner', icon: Home, label: 'Dashboard' },
  { href: '/owner/properties', icon: Building2, label: 'Properties' },
  { href: '/owner/units', icon: Home, label: 'Units' },
  { href: '/owner/tenants', icon: Users, label: 'Tenants' },
  { href: '/owner/payments', icon: DollarSign, label: 'Payments' },
  { href: '/owner/maintenance', icon: Wrench, label: 'Maintenance' },
  { href: '/owner/staff', icon: UserCircle, label: 'Staff' },
  { href: '/owner/risk-scores', icon: ShieldAlert, label: 'Risk Scores' },
  { href: '/owner/vacancy-alerts', icon: AlertTriangle, label: 'Vacancy Alerts' },
  { href: '/owner/maintenance-sla', icon: Timer, label: 'SLA Tracking' },
  { href: '/owner/analytics', icon: BarChart, label: 'Analytics' }
];

const caretakerLinks = [
  { href: '/caretaker', icon: Home, label: 'Dashboard' },
  { href: '/caretaker/properties', icon: Building2, label: 'Properties' },
  { href: '/caretaker/tasks', icon: ClipboardList, label: 'Tasks' },
  { href: '/caretaker/maintenance', icon: Wrench, label: 'Maintenance' },
  { href: '/caretaker/performance', icon: Timer, label: 'My Performance' }
];

const agentLinks = [
  { href: '/agent', icon: Home, label: 'Dashboard' },
  { href: '/agent/properties', icon: Building2, label: 'Properties' },
  { href: '/agent/leads', icon: Target, label: 'Leads' },
  { href: '/agent/viewings', icon: Calendar, label: 'Viewings' },
  { href: '/agent/earnings', icon: DollarSign, label: 'Earnings' }
];

const tenantLinks = [
  { href: '/tenant', icon: Home, label: 'Dashboard' },
  { href: '/tenant/payments', icon: DollarSign, label: 'Payments' },
  { href: '/tenant/maintenance', icon: Wrench, label: 'Maintenance' },
  { href: '/tenant/profile', icon: UserCircle, label: 'My Profile' }
];

const staffLinks = [
  { href: '/staff', icon: Home, label: 'Dashboard' },
  { href: '/staff/tasks', icon: ClipboardList, label: 'My Tasks' },
  { href: '/staff/attendance', icon: Calendar, label: 'Attendance' },
  { href: '/staff/maintenance', icon: Wrench, label: 'Maintenance' }
];

const adminLinks = [
  { href: '/admin', icon: Home, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/properties', icon: Building2, label: 'Properties' },
  { href: '/admin/reports', icon: BarChart, label: 'Reports' }
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const getLinks = () => {
    switch (user?.role) {
      case 'owner':
        return ownerLinks;
      case 'caretaker':
        return caretakerLinks;
      case 'agent':
        return agentLinks;
      case 'tenant':
        return tenantLinks;
      case 'staff':
        return staffLinks;
      case 'admin':
        return adminLinks;
      default:
        return [];
    }
  };

  const links = getLinks();

  const getRoleColor = () => {
    switch (user?.role) {
      case 'owner':
        return 'bg-blue-600';
      case 'tenant':
        return 'bg-purple-600';
      case 'staff':
        return 'bg-green-600';
      case 'admin':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <aside className={`bg-white border-r border-gray-200 min-h-screen flex flex-col transition-all duration-300 ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Building2 className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Propertech</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${getRoleColor()} rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-semibold text-sm">
              {user?.full_name?.charAt(0) || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto sidebar-nav">
        <div className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href || 
                             (link.href !== '/owner' && 
                              link.href !== '/tenant' && 
                              link.href !== '/staff' && 
                              link.href !== '/admin' && 
                              pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? `${getRoleColor()} bg-opacity-10 text-${user?.role === 'owner' ? 'blue' : user?.role === 'tenant' ? 'purple' : user?.role === 'staff' ? 'green' : 'red'}-700 font-medium`
                    : 'text-gray-700 hover:bg-gray-100'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? link.label : undefined}
              >
                <link.icon className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? '' : 'text-gray-500'
                }`} />
                {!collapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-gray-200 space-y-1">
        {['owner', 'agent', 'caretaker'].includes(user?.role || '') && (
          <Link
            href={`/${user?.role}/settings`}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings className="w-5 h-5 text-gray-500 flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>
        )}
        {user?.role === 'tenant' && (
          <Link
            href="/tenant/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Profile' : undefined}
          >
            <Settings className="w-5 h-5 text-gray-500 flex-shrink-0" />
            {!collapsed && <span>Profile</span>}
          </Link>
        )}

        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-700 hover:bg-red-50 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
