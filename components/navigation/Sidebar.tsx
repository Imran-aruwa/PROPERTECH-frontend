'use client';

import { useAuth } from '@/app/lib/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Building2, Users, DollarSign, Wrench, UserCircle,
  BarChart, LogOut, Settings, ChevronLeft, ChevronRight,
  ClipboardList, Calendar, Target, ShieldAlert, AlertTriangle, Timer, MessageSquare,
  ClipboardCheck, FileSignature, TrendingUp, Zap
} from 'lucide-react';
import { useState } from 'react';

const ownerLinks = [
  { href: '/owner', icon: Home, label: 'Dashboard' },
  { href: '/owner/properties', icon: Building2, label: 'Properties' },
  { href: '/owner/leases', icon: FileSignature, label: 'Leases' },
  { href: '/owner/units', icon: Home, label: 'Units' },
  { href: '/owner/inspections', icon: ClipboardCheck, label: 'Inspections' },
  { href: '/owner/tenants', icon: Users, label: 'Tenants' },
  { href: '/owner/payments', icon: DollarSign, label: 'Payments' },
  { href: '/owner/maintenance', icon: Wrench, label: 'Maintenance' },
  { href: '/owner/staff', icon: UserCircle, label: 'Staff' },
  { href: '/owner/market-intelligence', icon: TrendingUp, label: 'Market Intel' },
  { href: '/owner/automations', icon: Zap, label: 'Automations' },
];

const caretakerLinks = [
  { href: '/caretaker', icon: Home, label: 'Dashboard' },
  { href: '/caretaker/properties', icon: Building2, label: 'Properties' },
  { href: '/caretaker/maintenance', icon: Wrench, label: 'Maintenance' },
  { href: '/caretaker/inspections', icon: ClipboardCheck, label: 'Inspections' },
];

const agentLinks = [
  { href: '/agent', icon: Home, label: 'Dashboard' },
  { href: '/agent/properties', icon: Building2, label: 'Properties' },
  { href: '/agent/inspections', icon: ClipboardCheck, label: 'Inspections' },
  { href: '/agent/leads', icon: Target, label: 'Leads' },
  { href: '/agent/viewings', icon: Calendar, label: 'Viewings' },
  { href: '/agent/earnings', icon: DollarSign, label: 'Earnings' }
];

const tenantLinks = [
  { href: '/tenant', icon: Home, label: 'Dashboard' },
  { href: '/tenant/payments', icon: DollarSign, label: 'Payments' },
  { href: '/tenant/maintenance', icon: Wrench, label: 'Maintenance' },
  { href: '/tenant/profile', icon: UserCircle, label: 'Profile' },
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
      case 'caretaker':
        return 'bg-teal-600';
      case 'agent':
        return 'bg-indigo-600';
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

  const getActiveClass = () => {
    switch (user?.role) {
      case 'owner':
        return 'bg-blue-50 text-blue-700';
      case 'caretaker':
        return 'bg-teal-50 text-teal-700';
      case 'agent':
        return 'bg-indigo-50 text-indigo-700';
      case 'tenant':
        return 'bg-purple-50 text-purple-700';
      case 'staff':
        return 'bg-green-50 text-green-700';
      case 'admin':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <aside className={`bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300 ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Building2 className="w-7 h-7 text-blue-600" />
              <span className="text-lg font-bold text-gray-900">Propertech</span>
            </div>
          )}
          {collapsed && (
            <Building2 className="w-7 h-7 text-blue-600 mx-auto" />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 hover:bg-gray-100 rounded-lg transition-colors ${collapsed ? 'mx-auto mt-2' : ''}`}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* User Info - Fixed */}
      <div className="flex-shrink-0 p-3 border-b border-gray-200">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className={`w-9 h-9 ${getRoleColor()} rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-semibold text-sm">
              {user?.full_name?.charAt(0) || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate text-sm">{user?.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto sidebar-nav px-3 py-3">
        <div className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href ||
              (link.href !== `/${user?.role}` && pathname.startsWith(link.href + '/'));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? `${getActiveClass()} font-medium`
                    : 'text-gray-700 hover:bg-gray-100'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? link.label : undefined}
              >
                <link.icon className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? '' : 'text-gray-500'
                }`} />
                {!collapsed && <span className="text-sm">{link.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Actions - Fixed */}
      <div className="flex-shrink-0 p-3 border-t border-gray-200 space-y-1 bg-white">
        <Link
          href={`/${user?.role}/settings`}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="w-5 h-5 text-gray-500 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Settings</span>}
        </Link>

        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-700 hover:bg-red-50 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
